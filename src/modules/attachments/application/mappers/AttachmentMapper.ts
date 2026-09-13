import { Attachment } from "@modules/attachments/domain/entities/Attachment.js";
import { GenerateUploadUrlResponse } from "../dto/response/GenerateUploadUrlResponse.js";
import { ConfirmUploadResponse } from "../dto/response/ConfirmUploadResponse.js";
import { AttachmentDetailResponse } from "../dto/response/AttachmentDetailResponse.js";
import { GenerateDownloadUrlResponse } from "../dto/response/GenerateDownloadUrlResponse.js";



export class AttachmentMapper{

    static toDetailResponse(attachment:Attachment):AttachmentDetailResponse{
        return {
            ...attachment
        }
    }

    static toGenerateUploadResponse(attachment:Attachment, uploadUrl:string, expiresIn:number ):GenerateUploadUrlResponse{
        return {
            id: attachment.id,
            uploadUrl,
            expiresIn
        }
    }

    static toGenerateDownloadResponse(attachment:Attachment, downloadUrl:string, expiresIn:number ):GenerateDownloadUrlResponse{
        return {
            id: attachment.id,
            downloadUrl,
            expiresIn
        }
    }

    static toConfirmResponse(attachment:Attachment):ConfirmUploadResponse{
        return {
            id: attachment.id,
            key: attachment.key,
            status:attachment.status
        }
    }
}