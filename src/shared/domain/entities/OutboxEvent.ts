import { DomainEvent } from "./DomainEvent.js";


export enum OutboxEventStatus{
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    PUBLISHED = "PUBLISHED",
    FAILED = "FAILED"
}


export class OutboxEvent {

    constructor(readonly id:string,
        readonly entityType: string,
        readonly entityId: string,
        readonly action: string,
        readonly payload: unknown,
        private _status: OutboxEventStatus,
        private _retryCount:number,
        private _lastError: string | null,
        private _correlationId: string,
        readonly createdAt:Date,
        private _publishedAt:Date | null
    ){}

    static create(event:DomainEvent, correlationId:string):OutboxEvent{
        return new OutboxEvent(
            event.id,
            event.entityType,
            event.entityId,
            event.action,
            event.toPayload(),
            OutboxEventStatus.PENDING,
            0,
            null,
            correlationId,
            new Date(),
            null
        );
    }

    get type(){
        return  this.entityType+"."+this.action;
    }

    static fromDomainEvents(events:DomainEvent[], correlationId:string):OutboxEvent[]{
        return events.map(e => this.create(e,correlationId));
    }

    static createMany(events:DomainEvent[], correlationId:string):OutboxEvent[]{
        return events.map(e => OutboxEvent.create(e,correlationId));
    }

    get status(){
        return this._status;
    }

    get retryCount(){
        return this._retryCount;
    }

    get lastError(){
        return this._lastError;
    }

    get publishedAt(){
        return this._publishedAt;
    }

    get correlationId(){
        return this._correlationId
    }

    markProcessing(){
        this._status= OutboxEventStatus.PROCESSING;
    }

    markPublished(publishedAt:Date){
        this._status= OutboxEventStatus.PUBLISHED;
        this._publishedAt= publishedAt
    }

    markFailed(error: string){
        this._status= OutboxEventStatus.FAILED;
        this._retryCount++;
        this._lastError= error;
    }
}