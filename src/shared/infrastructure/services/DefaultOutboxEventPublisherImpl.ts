
import { OutboxEvent } from "@shared/domain/entities/OutboxEvent.js";
import { OutboxPublisher } from "@shared/application/events/OutboxPublisher.js";
import { OutboxRepository } from "@shared/domain/repositories/OutboxRepository.js";
import { EventPublisher } from "@shared/application/events/EventPublisher.js";
import { Logger } from "@shared/logger/Logger.js";

export class DefaultOutboxEventPublisherImpl implements OutboxPublisher {

    constructor(private readonly repository: OutboxRepository,
        readonly publisher: EventPublisher,
        private readonly logger: Logger
    ){}

    async publish(events: OutboxEvent[]): Promise<void> {
       if(events.length===0){
        return Promise.resolve();
       }

        await this.publisher.publishAll(events);
        await this.repository.update(events);

        const failed = events.filter((e) => e.status === "FAILED");
        if (failed.length > 0) {
            this.logger.error(`${failed.length} outbox event(s) failed to publish`, { eventIds: failed.map((e) => e.id) });
        }


    }

}