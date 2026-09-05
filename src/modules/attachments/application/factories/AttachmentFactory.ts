import { StorageConfig } from "@shared/config/StorageConfig.js";
import { StorageKeyGenerator } from "../services/StorageKeyGenerator.js";
import { FileInformation } from "@modules/attachments/domain/value-objects/FileInformation.js";
import { Attachment, AttachmentResourceType, AttachmentStatus, AttachmentVisibility } from "@modules/attachments/domain/entities/Attachment.js";
import { randomUUID } from "node:crypto";



export class AttachmentFactory {
    constructor(private readonly storageConfig: StorageConfig,
        private readonly storageKeyGenerator: StorageKeyGenerator
    ){}

    createPending(file:FileInformation, 
        ownerUserId:string,
        ownerUserEmail:string,
        resourceType:AttachmentResourceType,
        resourceId:string,
        visibility: AttachmentVisibility= AttachmentVisibility.PRIVATE
    ){
        const id = randomUUID();
        return new Attachment(id,
            file,
            this.storageConfig.bucket,
            this.storageKeyGenerator.generate({id,resourceType,resourceId,extension:file.extension}),
            AttachmentStatus.PENDING,
            visibility,
            resourceType,
            resourceId,
            ownerUserId,
            ownerUserEmail,
            true,
            new Date()
        );
    }
}