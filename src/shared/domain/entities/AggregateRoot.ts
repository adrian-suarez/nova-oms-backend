import { DomainEvent } from "./DomainEvent.js";

export abstract class AggregateRoot {
    private _domainEvents:DomainEvent[]=[];

    addDomainEvent(event:DomainEvent):void{
        this._domainEvents.push(event);
    }

    pullDomainEvents():DomainEvent[]{
        const events = [...this._domainEvents];
        this._domainEvents = []
        return events;
    }

    hasPendingEvents():boolean{
        return this._domainEvents.length >0;
    }
}