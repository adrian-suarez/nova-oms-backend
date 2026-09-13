import { AttachmentResourceType, AttachmentVisibility } from "@modules/attachments/domain/entities/Attachment.js";
import z from "zod"

export const GenerateUploadUrlSchema = z.object({
    fileName: z.string().min(5),
    contentType: z.string().min(4).max(30),
    size: z.coerce.number().int(),
    resourceType: z.enum(AttachmentResourceType),
    resourceId:z.uuid(),
    visibility:z.enum(AttachmentVisibility).optional(),
});

export type GenerateUploadUrlRequestSchema = z.infer<typeof GenerateUploadUrlSchema>;