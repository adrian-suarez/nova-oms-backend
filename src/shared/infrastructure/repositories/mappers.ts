import { Prisma } from "@prisma/client";
import { Idempotency } from "@shared/domain/entities/Idempotency.js";
import { OutboxEvent, OutboxEventStatus } from "@shared/domain/entities/OutboxEvent.js";


export function toOutboxEventEntity(data: Prisma.OutboxEventGetPayload<{}>): OutboxEvent {
  return new OutboxEvent(
    data.id,
    data.entityType,
    data.entityId,
    data.action,
    data.payload,
    data.status as OutboxEventStatus,
    data.retryCount,
    data.lastError,
    data.correlationId,
    data.createdAt,
    data.publishedAt
  );
}


export function toIdempotencyEntity(data: Prisma.IdempotencyKeyGetPayload<{}>): Idempotency{
  return {
    id: data.id,
    requestHash: data.requestHash,
    status: data.status,
    statusCode: data.statusCode ?? undefined,
    responseBody: data.responseBody,
    createdAt: data.createdAt
  }
}