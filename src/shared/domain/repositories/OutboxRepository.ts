import { OutboxEvent } from "../entities/OutboxEvent.js";


export interface OutboxRepository{

    create(events:OutboxEvent[]):Promise<void>;
    claimPending(limit:number):Promise<OutboxEvent[]>;
    update(events:OutboxEvent[]):Promise<void>;
    delete(events:OutboxEvent[], force:boolean):Promise<void>;

}