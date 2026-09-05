import { AttachmentResourceType, AttachmentVisibility } from "@modules/attachments/domain/entities/Attachment.js";


export interface GenerateUploadUrlRequest{
    fileName:string;
    contentType:string;
    size:number;

    resourceType: AttachmentResourceType;
    resourceId: string;
    visibility?: AttachmentVisibility,
    ownerUserId: string,
    ownerUserEmail: string

}
