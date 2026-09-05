import { DomainEvent } from "@shared/domain/entities/DomainEvent.js";


export class AttachmentFailedEvent extends DomainEvent {
   
constructor(
        readonly entityId: string,
        readonly ownerUserId: string,
        readonly ownerUserEmail: string,
        readonly fileName: string,
        readonly error?: string,
    ){
        super("attachment",entityId,"failed");
    }

    toPayload(): Record<string, unknown> {
        return{
            userId: this.entityId,
            ownerUserId: this.ownerUserId,
            ownerUserEmail: this.ownerUserEmail,
            fileName: this.fileName,
            error: this.error
        };
    }
}