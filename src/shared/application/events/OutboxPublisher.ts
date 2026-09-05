import { OutboxEvent } from "@shared/domain/entities/OutboxEvent.js";


export interface OutboxPublisher{
    publish(events:OutboxEvent[]):Promise<void>;

}