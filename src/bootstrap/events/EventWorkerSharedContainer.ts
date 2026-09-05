import { OutboxPublisherWorker } from "@shared/application/workers/OutboxPublisherWorker.js";
import { EventSharedContainer } from "./EventSharedContainer.js";


export class EventWorkerSharedContainer {

    readonly outboxPublisherWorker: OutboxPublisherWorker;

    constructor(eventSharedContainer: EventSharedContainer){
        this.outboxPublisherWorker = new OutboxPublisherWorker(eventSharedContainer.outboxRepository,eventSharedContainer.outboxPublisher);
    }

}
