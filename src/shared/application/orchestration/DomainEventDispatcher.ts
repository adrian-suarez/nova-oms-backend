import { UnitOfWork } from "@shared/database/UnitOfWork.js";
import { AggregateRoot } from "@shared/domain/entities/AggregateRoot.js";
import { OutboxRepository } from "@shared/domain/repositories/OutboxRepository.js";
import { OutboxPublisher } from "../events/OutboxPublisher.js";
import { OutboxEvent } from "@shared/domain/entities/OutboxEvent.js";
import { DomainEventHandler, DomainEventOutcome } from "@shared/application/events/DomainEventHandler.js";
import { DomainEvent } from "@shared/domain/entities/DomainEvent.js";
import { ExecutionContextProvider } from "../context/ExecutionContextProvider.js";
import { Logger } from "@shared/logger/Logger.js";


export class DomainEventDispatcher{
    constructor(private readonly uow:UnitOfWork,
        private readonly outboxRepository:OutboxRepository,
        private readonly outboxPublisher: OutboxPublisher,
        private readonly handlers: DomainEventHandler[],
        private readonly executionContextProvider: ExecutionContextProvider,
        private readonly logger: Logger
    ){}

    async dispatcher( aggregate: AggregateRoot, work :()=>Promise<void>, confirm:boolean = true){
        let events: DomainEvent[] = [];
        let outboxEvents: OutboxEvent[] = [];
        const correlationId = this.executionContextProvider.get().correlationId;

        // El evento se persiste en la MISMA transacción que el cambio de datos, antes de
        // intentar publicar — si la publicación falla después, el evento queda recuperable
        // (PrismaOutboxRepositoryImpl + OutboxPublisherWorker como red de reintento), nunca
        // se pierde ni se publica "fantasma" si la transacción revierte. Ver ADR-0002.
        await this.uow.execute(async()=>{
            await work();
            
            events = aggregate.pullDomainEvents();
            if(events.length===0){return;}

            outboxEvents = OutboxEvent.fromDomainEvents(events,correlationId);
            await this.outboxRepository.create(outboxEvents);
        });

        if(confirm){
            await this.confirmSuccess(events,outboxEvents);
        }

        return {events,outboxEvents};
        
    }

    async confirmSuccess(
        events: DomainEvent[],
        outboxEvents: OutboxEvent[]
    ): Promise<void> {
        if (events.length === 0) return;

        await this.uow.execute(async () => {
            await this.runHandlers(events, "SUCCESS");
        });

        await this.outboxPublisher.publish(outboxEvents).catch((error) =>
            this.logger.error("Outbox publisher error", { error })
        );
    }

    async confirmFailure(
        events: DomainEvent[],
        outboxEvents: OutboxEvent[],
        reason: string,
        compensate?: () => Promise<void>,
    ): Promise<void> {
        await this.uow.execute(async () => {
            await compensate?.();
            await this.outboxRepository.delete(outboxEvents, true);
            await this.runHandlers(events, "FAILED", reason);
        });
    }

    private async runHandlers(
        events: DomainEvent[],
        outcome: DomainEventOutcome,
        reason?: string,
    ): Promise<void> {
        const user = this.executionContextProvider.get()?.getUser(true);
        const correlationId = this.executionContextProvider.get().correlationId

        for (const handler of this.handlers) {
            try {
                await handler.handle(user?.id ?? null,events, outcome,correlationId, reason);
            } catch (error) {
                this.logger.error(`DomainEventHandler failed: ${handler.constructor.name}`, { error });
            }
        }
    }

}