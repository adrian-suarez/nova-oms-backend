
import { PipelineBehavior, PipelineNext } from "../PipelineBehavior.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { ValidationError } from "@shared/errors/ValidationError.js";
import { IdempotencyRepository } from "@shared/domain/repositories/IdempotencyRepository.js";
import { createHash } from "node:crypto";
import { ConflictError } from "@shared/errors/ConflictError.js";

// En Lambda no hay estado compartido en memoria entre invocaciones concurrentes —
// la misma Idempotency-Key puede llegar a dos consumidores distintos al mismo
// tiempo, por eso el claim tiene que ser atómico a nivel de DB, no en memoria.
// El hash del body (no solo la key) es lo que distingue esto de un cache simple:
// evita que el reuso accidental de la misma key con datos distintos devuelva la
// respuesta vieja en silencio — se avisa con 409 en vez de eso. Ver ADR-0008.
export class IdempotencyBehavior implements PipelineBehavior<APIGatewayProxyEventV2,
        APIGatewayProxyStructuredResultV2>{
    
    constructor(private readonly idempotencyRepository:IdempotencyRepository){}
    
    async handle(descriptor: HandlerDescriptor,event: APIGatewayProxyEventV2, context: Context, next: PipelineNext<APIGatewayProxyStructuredResultV2>): Promise<APIGatewayProxyStructuredResultV2> {
        const idempotency = descriptor.idempotent;

        if(!idempotency){
            return next();
        }

        const idempotencyKey = event.headers["Idempotency-Key"];

        if(!idempotencyKey){
            throw new ValidationError("Idempotency-Key is missing");
        }
        const requestHash = createHash("sha256").update(event.body ??"").digest("hex");

        const claim = await this.idempotencyRepository.claim({
            id: idempotencyKey,
            requestHash,
        });

        if(!claim){
            const existing = await this.idempotencyRepository.findByKey(idempotencyKey);
            if(existing!.requestHash !== requestHash){
                throw new ConflictError("Idempotency-Key already used with a different request body");
            }

            if(existing!.status === "PROCESSING"){
                throw new ConflictError("A request with this Idempotency-Key is already in progress");
            }

            return {statusCode: existing!.statusCode, body: JSON.stringify(existing!.responseBody)};

        }
        try {
            const response = await next();

            await this.idempotencyRepository.complete({
                id: idempotencyKey,
                requestHash,
                statusCode: response.statusCode ?? 200,
                responseBody: response.body ? JSON.parse(response.body) : null
            });
            return response;

        } catch (error) {
            await this.idempotencyRepository.release({
                id: idempotencyKey,
                requestHash
            });
            throw error;
        }
      
    }
    
}