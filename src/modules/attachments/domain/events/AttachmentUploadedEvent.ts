import { DomainEvent } from "@shared/domain/entities/DomainEvent.js";


export class AttachmentUploadedEvent extends DomainEvent {
   
    constructor(
        readonly entityId: string,
        readonly ownerUserId: string,
        readonly ownerUserEmail: string,
        readonly fileName: string,
    ){
        super("attachment",entityId,"uploaded");
    }

    toPayload(): Record<string, unknown> {
        return{
            userId: this.entityId,
            ownerUserId: this.ownerUserId,
            ownerUserEmail: this.ownerUserEmail,
            fileName: this.fileName
        };
    }
}