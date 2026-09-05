import { AggregateRoot } from "@shared/domain/entities/AggregateRoot.js";
import { DomainEventDispatcher } from "./DomainEventDispatcher.js";


export interface ExternalSyncSteps {
    aggregate: AggregateRoot;

    localTransaction():Promise<void>;
    externalSync?(): Promise<void>;
    compensate?():Promise<void>;
}


export class ExternalSyncOrchestrator{
    constructor(
        private readonly domainEventDispatcher:DomainEventDispatcher,
    ){}

    async run(steps:ExternalSyncSteps ){

        const {events , outboxEvents} = await this.domainEventDispatcher.dispatcher(
            steps.aggregate,
            steps.localTransaction,
            false
        );

        if(steps.externalSync){
            try{
                await steps.externalSync();
            }catch(error){
                await this.domainEventDispatcher.confirmFailure(events,outboxEvents,String(error),steps.compensate);
                throw error;
            }
        }

        await this.domainEventDispatcher.confirmSuccess(events,outboxEvents);
    }
}