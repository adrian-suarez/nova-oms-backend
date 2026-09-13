import { Attachment, AttachmentResourceType, AttachmentStatus, AttachmentVisibility } from "@modules/attachments/domain/entities/Attachment.js";
import { FileInformation } from "@modules/attachments/domain/value-objects/FileInformation.js";
import { Prisma } from "@prisma/client";



export function toAttachmentEntity(data:Prisma.AttachmentGetPayload<{}> ): Attachment{
  return new Attachment(
    data.id,
    new FileInformation(data.fileName,data.extension,data.contentType,Number(data.size)),
    data.bucket,
    data.key,
    data.status as AttachmentStatus,
    data.visibility as AttachmentVisibility,
    data.resourceType as AttachmentResourceType,
    data.resourceId,
    data.ownerUserId,
    data.ownerUserEmail,
    data.enabled,
    data.createdAt,
    data.updatedAt,
    data.deletedAt
  );
}