import { Audit } from "@modules/audit/domain/entities/Audit.js";
import { Prisma } from "@prisma/client";
import { DomainEventOutcome } from "@shared/application/events/DomainEventHandler.js";

export function toAuditEntity(data: Prisma.AuditGetPayload<{}>): Audit{
  return new Audit(
    data.id,
    data.userId,
    data.entityType,
    data.entityId,
    data.action,
    data.payload,
    data.outcome as DomainEventOutcome,
    data.errorMessage,
    data.correlationId,
    data.createdAt
  );
}