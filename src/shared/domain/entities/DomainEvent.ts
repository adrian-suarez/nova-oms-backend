import { randomUUID } from "node:crypto";


export abstract class DomainEvent{
    readonly id: string;
    readonly entityType: string;
    readonly entityId: string;
    readonly action: string;
    readonly date: Date;

    constructor(entityType:string,entityId:string, action:string){
        this.id = randomUUID();
        this.entityType= entityType;
        this.entityId = entityId;
        this.action= action;
        this.date = new Date();
        
    }

    abstract toPayload(): Record<string, unknown>;
}
