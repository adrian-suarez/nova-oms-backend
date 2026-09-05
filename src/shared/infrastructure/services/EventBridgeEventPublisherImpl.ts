import { EventPublisher } from "@shared/application/events/EventPublisher.js";

import {EventBridgeClient, PutEventsCommand, PutEventsRequestEntry} from "@aws-sdk/client-eventbridge"
import { OutboxEvent } from "@shared/domain/entities/OutboxEvent.js";
import { Logger } from "@shared/logger/Logger.js";

export class EventBridgeEventPublisherImpl implements EventPublisher {

    constructor(private readonly client: EventBridgeClient,
        private readonly eventBusName: string,
        private readonly logger: Logger,
    ){
    }

    async publish(event: OutboxEvent): Promise<void> {
        return await this.publishAll([event]);
    }

    async publishAll(events: OutboxEvent[]): Promise<void> {

        if(events.length===0){
            return Promise.resolve();
        }

        const batches = this.chunks(events,10);

        for(const batch of batches){
            const entries: PutEventsRequestEntry[] = batch.map((event)=>({
                EventBusName: this.eventBusName,
                Source: event.entityType,
                DetailType: event.type,
                Detail: JSON.stringify({eventId:event.id, correlationId:event.correlationId,...event.payload as object})
            }))
            try {
                const response = await this.client.send(new PutEventsCommand({
                    Entries: entries
                }));

                response.Entries?.forEach((entry, i) => {
                    if (entry.ErrorCode) {
                        batch[i]!.markFailed(entry.ErrorMessage ?? entry.ErrorCode);
                    } else {
                        batch[i]!.markPublished(new Date());
                    }
                });

                if(response.FailedEntryCount && response.FailedEntryCount >0){
                    const failed = response.Entries?.filter((e)=>e.ErrorCode)?? [];
                    this.logger.error("Failed events when publishing to EventBridge", { failed });
                }
            } catch (error) {
                this.logger.error("EventBridge PutEvents batch failed entirely", { error });
                batch.forEach((e) => e.markFailed(String(error)));
            }
            
        }

    }

    private chunks(events: OutboxEvent[],size:number){
        const result: OutboxEvent[][]=[];

        for(let i = 0; i< events.length; i+=size){
            result.push(events.slice(i,i+size));
        }

        return result;
    }

}