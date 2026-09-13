import { OutboxEvent } from "@shared/domain/entities/OutboxEvent.js";


export interface EventPublisher{
    publish(event:OutboxEvent):Promise<void>;
    publishAll(events:OutboxEvent[]):Promise<void>;

}