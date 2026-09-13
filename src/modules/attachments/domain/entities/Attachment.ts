import { AggregateRoot } from "@shared/domain/entities/AggregateRoot.js";
import { FileInformation } from "../value-objects/FileInformation.js";
import { ValidationError } from "@shared/errors/ValidationError.js";
import { AttachmentUploadedEvent } from "../events/AttachmentUploadedEvent.js";
import { AttachmentFailedEvent } from "../events/AttachmentFailedEvent.js";
import { AttachmentDeletedEvent } from "../events/AttachmentDeletedEvent.js";

export enum AttachmentStatus {
    PENDING = "PENDING",
    FAILED = "FAILED",
    UPLOADED = "UPLOADED",
    DELETED = "DELETED"
}

export enum AttachmentVisibility {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
}

export enum AttachmentResourceType {
    USERS = "USERS",
    TICKETS = "TICKETS",
}
export class Attachment extends AggregateRoot {

    constructor(
        public readonly id:string,
        public file: FileInformation,
        public bucket:string,
        public key:string,
        public status:AttachmentStatus,
        public visibility: AttachmentVisibility,
        public resourceType: AttachmentResourceType| null,
        public resourceId:string|null,
        public ownerUserId:string,
        public ownerUserEmail:string,
        public enabled:boolean,
        public createdAt:Date,
        public updatedAt?:Date| null,
        public deletedAt?:Date| null,
    ){
        super();
    }


    confirmUpload(){
        if(this.status!=AttachmentStatus.PENDING){
            throw new ValidationError("Only pending attachment can be confirmed");
        }

        this.status= AttachmentStatus.UPLOADED;
        this.updatedAt= new Date();

        this.addDomainEvent(new AttachmentUploadedEvent(this.id, this.ownerUserId,this.ownerUserEmail, this.file.fileName));
        
    }

    fail(error?:string){
        if(this.status!=AttachmentStatus.PENDING){
            return;
        }

        this.status= AttachmentStatus.FAILED;
        this.updatedAt= new Date();

        this.addDomainEvent(new AttachmentFailedEvent(this.id, this.ownerUserId,this.ownerUserEmail, this.file.fileName, error));

    }

    delete(){
        if(this.status==AttachmentStatus.DELETED){
            return;
        }

        this.status= AttachmentStatus.DELETED;
        this.enabled= false;
        this.deletedAt= new Date();

        this.addDomainEvent(new AttachmentDeletedEvent(this.id, this.ownerUserId,this.ownerUserEmail, this.file.fileName));

    }
}