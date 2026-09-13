import { Audit } from "@modules/audit/domain/entities/Audit.js";
import { AuditRepository } from "@modules/audit/domain/repositories/AuditRepository.js";
import { DomainEvent } from "@shared/domain/entities/DomainEvent.js";
import { DomainEventHandler, DomainEventOutcome } from "@shared/application/events/DomainEventHandler.js";

export class AuditEventHandler implements DomainEventHandler{

    constructor(private repository: AuditRepository){}

    async handle(userId:string | null, events: DomainEvent[], outcome: DomainEventOutcome, correlationId:string,reason?: string,): Promise<void> {
        const audits = Audit.fromDomainEvents(userId,events, outcome,reason,correlationId);
        await this.repository.create(audits);
    }

}