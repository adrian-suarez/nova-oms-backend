import { DomainEvent } from "@shared/domain/entities/DomainEvent.js";


export class UserCreatedEvent extends DomainEvent {
   
    constructor(
        readonly entityId: string,
        readonly email: string,
    ){
        super("user",entityId,"created");
    }

    toPayload(): Record<string, unknown> {
        return{
            userId: this.entityId,
            email: this.email
        };
    }

}