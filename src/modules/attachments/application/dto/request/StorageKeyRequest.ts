import { AttachmentResourceType } from "@modules/attachments/domain/entities/Attachment.js";


export interface StorageKeyRequest {
    id: string;
    resourceType: AttachmentResourceType;
    resourceId: string;
    extension: string;
}