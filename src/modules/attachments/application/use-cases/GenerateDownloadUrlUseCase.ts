
import { AttachmentStatus } from "@modules/attachments/domain/entities/Attachment.js";
import { AttachmentRepository } from "@modules/attachments/domain/repositories/AttachmentRepository.js";
import { EntityRequest } from "@shared/application/dto/EntityRequest.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { StorageConfig } from "@shared/config/StorageConfig.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { ValidationError } from "@shared/errors/ValidationError.js";
import { GenerateDownloadUrlResponse } from "../dto/response/GenerateDownloadUrlResponse.js";
import { AttachmentMapper } from "../mappers/AttachmentMapper.js";
import { StorageProvider } from "../providers/StorageProvider.js";

export class GenerateDownloadUrlUseCase implements UseCase<EntityRequest,GenerateDownloadUrlResponse>{

    constructor(
        private readonly repository:AttachmentRepository,
        private readonly storageProvider:StorageProvider,
        private readonly storageConfig: StorageConfig,
    ){}
    async execute(request: EntityRequest): Promise<GenerateDownloadUrlResponse> {

         const attachment = await this.repository.findById(request.id);

        if(!attachment){
            throw new NotFoundError(`Attachment: ${request.id}`);
        }

        if(attachment.status !== AttachmentStatus.UPLOADED){
            throw new ValidationError("Attachment is not available.");
        }


        const downloadUrl = await this.storageProvider.generateDownloadUrl({
            bucket:attachment.bucket,
            key: attachment.key,
            expiresIn: this.storageConfig.expiration
        });
        
        return AttachmentMapper.toGenerateDownloadResponse(attachment, downloadUrl,this.storageConfig.expiration);

    }
    
}