import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { IdempotencyRepository } from "@shared/domain/repositories/IdempotencyRepository.js";
import { Idempotency } from "@shared/domain/entities/Idempotency.js";
import { toIdempotencyEntity } from "./mappers.js";
import { Prisma } from "@prisma/client";


// Ventana de abandono: si un claim queda en PROCESSING más tiempo que esto, se asume que
// el Lambda que lo tomó murió antes de llamar complete()/release() (timeout, crash, cold
// start caído) y se permite reclamarlo — bien por encima del timeout máximo configurado de
// Lambda (NodeLambdaFactory.ts, 30s) para no pisar una request legítima todavía en curso.
const STALE_PROCESSING_MS = 60_000;

export class PrismaIdempotencyRepositoryImpl implements IdempotencyRepository {

    constructor(readonly provider: PrismaProvider){}

    async claim(idempotency: Idempotency): Promise<boolean> {
        try {
            await this.provider.getClient().idempotencyKey.create({
                data: {
                    id: idempotency.id,
                    requestHash: idempotency.requestHash,
                    status: "PROCESSING",
                }
            });
            return true;
        } catch(error){
            if(error instanceof Prisma.PrismaClientKnownRequestError && error.code ==="P2002"){
                return this.reclaimIfAbandoned(idempotency);
            }
            throw error;
        }
    }

    private async reclaimIfAbandoned(idempotency: Idempotency): Promise<boolean> {
        const result = await this.provider.getClient().idempotencyKey.updateMany({
            where: {
                id: idempotency.id,
                status: "PROCESSING",
                createdAt: { lt: new Date(Date.now() - STALE_PROCESSING_MS) },
            },
            data: {
                requestHash: idempotency.requestHash,
                status: "PROCESSING",
                createdAt: new Date(),
            },
        });
        return result.count > 0;
    }

    async complete(idempotency: Idempotency): Promise<void> {
       
        await this.provider.getClient().idempotencyKey.update({
            where:{id: idempotency.id},
            data: {
                status: "COMPLETED",
                statusCode: idempotency.statusCode,
                responseBody: idempotency.responseBody as Prisma.InputJsonValue,
            }
        });
    }

    async release(idempotency: Idempotency): Promise<void> {
        await this.provider.getClient().idempotencyKey.delete({
            where:{id: idempotency.id}
        });
    }
    async findByKey(id:string): Promise<Idempotency | null> {
        const entity =  await this.provider.getClient().idempotencyKey.findUnique({
            where:{
                id
            }
        });

        return entity ? toIdempotencyEntity(entity) : null;
    }

}