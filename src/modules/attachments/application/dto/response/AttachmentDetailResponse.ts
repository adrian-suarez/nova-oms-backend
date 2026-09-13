import { AttachmentResourceType, AttachmentStatus, AttachmentVisibility } from "@modules/attachments/domain/entities/Attachment.js";
import { FileInformation } from "@modules/attachments/domain/value-objects/FileInformation.js";


export interface AttachmentDetailResponse{
    id:string;
    file: FileInformation;
    bucket:string;
    key:string;
    status:AttachmentStatus;
    visibility: AttachmentVisibility;
    resourceType: AttachmentResourceType| null;
    resourceId:string|null;
    ownerUserId:string;
    ownerUserEmail:string;
    enabled:boolean;
    createdAt:Date;
    updatedAt?:Date| null;
    deletedAt?:Date| null;
}