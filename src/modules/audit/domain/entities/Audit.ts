import { DomainEventOutcome } from "@shared/application/events/DomainEventHandler.js";
import { DomainEvent } from "@shared/domain/entities/DomainEvent.js";


export class Audit {
    constructor(readonly id:string, 
        readonly userId: string | null,
        readonly entityType:string,
        readonly entityId:string|null,
        readonly action: string,
        readonly payload: unknown,
        readonly outcome: DomainEventOutcome,
        readonly errorMessage: string | null,
        readonly correlationId: string,
        readonly createdAt: Date
    ){}

    static fromDomainEvents(userId:string | null, events: DomainEvent[],outcome: DomainEventOutcome, errorMessage: string | null = null, correlationId:string): Audit[] {
    return events.map((event) =>
        new Audit(
            crypto.randomUUID(),
            userId,
            event.entityType,
            event.entityId,
            event.action,
            event.toPayload(),
            outcome,
            errorMessage,
            correlationId,
            new Date(),
        )
    );
}
}