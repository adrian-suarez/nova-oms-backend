import { OutboxPublisher } from "@shared/application/events/OutboxPublisher.js";
import { OutboxRepository } from "@shared/domain/repositories/OutboxRepository.js";


export class OutboxPublisherWorker {

    constructor(private readonly repository: OutboxRepository,
        private readonly publisher: OutboxPublisher
    ){}

    async execute():Promise<void>{
        const events = await this.repository.claimPending(100);

        await this.publisher.publish(events);
    }
}