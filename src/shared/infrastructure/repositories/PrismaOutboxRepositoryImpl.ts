import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { OutboxEvent, OutboxEventStatus } from "@shared/domain/entities/OutboxEvent.js";
import { OutboxRepository } from "@shared/domain/repositories/OutboxRepository.js";
import { toOutboxEventEntity } from "./mappers.js";
import { Prisma } from "@prisma/client";



export class PrismaOutboxRepositoryImpl implements OutboxRepository{

    constructor(readonly provider: PrismaProvider){}
   
    async create(events: OutboxEvent[]): Promise<void> {
        if(events.length === 0){
            return Promise.resolve();
        }

        await this.provider.getClient().outboxEvent.createMany({
            data: events.map(event => ({
                id: event.id,
                entityType: event.entityType,
                entityId: event.entityId,
                action: event.action,
                payload: event.payload as object,
                status: event.status,
                retryCount: event.retryCount,
                lastError: event.lastError,
                correlationId: event.correlationId,
                createdAt: event.createdAt,
                publishedAt: event.publishedAt
            }))
        });
    }
    // Pessimistic locking (no optimistic): dos ejecuciones concurrentes del worker
    // nunca pueden reclamar la misma fila — SKIP LOCKED hace que la segunda salte
    // las filas ya bloqueadas en vez de esperar. El UPDATE de confirmación corre
    // sobre el mismo `tx`, no sobre un cliente nuevo — si se cambia esto, el lock
    // deja de proteger nada. Ver ADR-0010.
    async claimPending(limit: number): Promise<OutboxEvent[]> {

        return await this.provider.getClient().$transaction(async(tx) =>{
            const entities =  await tx.$queryRaw<Prisma.OutboxEventGetPayload<{}>[]>`
                SELECT * FROM "outbox_events"
                WHERE status = ${OutboxEventStatus.PENDING}
                ORDER BY "createdAt" ASC
                LIMIT ${limit}
                FOR UPDATE SKIP LOCKED
            `;

            if(entities.length ===0){
                return [];
            }

            const ids = entities.map(e => e.id);

            await tx.outboxEvent.updateMany({
                data:{
                    status:OutboxEventStatus.PROCESSING
                },
                where:{
                    id:{ in: ids },
                    status: OutboxEventStatus.PENDING
                }
            });

            return entities.map(toOutboxEventEntity);
        });
       
    }
    async update(events: OutboxEvent[]): Promise<void> {
        await Promise.all([
            ...events.map((e) => this.provider.getClient().outboxEvent.update({
                data:{
                    status:e.status,
                    retryCount:e.retryCount,
                    lastError:e.lastError,
                    publishedAt:e.publishedAt
                },
                where:{ id:e.id }
            }))
        ]);
    }

    async delete(events: OutboxEvent[], force: boolean): Promise<void> {
        const ids = events.map(e=>e.id);
        if(force){
            await this.provider.getClient().outboxEvent.deleteMany({where:{id:{in:ids }}});
        }else{
            await this.provider.getClient().outboxEvent.updateMany({data:{deletedAt: new Date(), enabled:false}, where:{id:{in:ids}}});
        }
    }


}