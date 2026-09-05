
import { GenerateUploadUrlRequest } from "../dto/request/GenerateUploadUrlRequest.js";
import { GenerateUploadUrlResponse } from "../dto/response/GenerateUploadUrlResponse.js";
import { AttachmentRepository } from "@modules/attachments/domain/repositories/AttachmentRepository.js";
import { StorageProvider } from "../providers/StorageProvider.js";
import { StoragePolicy } from "../services/StoragePolicy.js";
import { AttachmentFactory } from "../factories/AttachmentFactory.js";
import { StorageConfig } from "@shared/config/StorageConfig.js";
import { FileUtils } from "@shared/files/FileUtils.js";
import { FileInformation } from "@modules/attachments/domain/value-objects/FileInformation.js";
import { AttachmentMapper } from "../mappers/AttachmentMapper.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";

export class GenerateUploadUrlUseCase implements UseCase<GenerateUploadUrlRequest,GenerateUploadUrlResponse>{

    constructor(
        private readonly repository:AttachmentRepository,
        private readonly storageProvider:StorageProvider,
        private readonly storagePolicy: StoragePolicy,
        private readonly attachmentFactory:AttachmentFactory,
        private readonly storageConfig: StorageConfig,
    ){}
    async execute(request: GenerateUploadUrlRequest): Promise<GenerateUploadUrlResponse> {

        const extension = FileUtils.getExtension(request.fileName);

        const file = new FileInformation(request.fileName, extension,request.contentType,request.size);

        this.storagePolicy.validate(file);

        const attachment = this.attachmentFactory.createPending(file,
            request.ownerUserId,
            request.ownerUserEmail,
            request.resourceType,
            request.resourceId,
            request.visibility
        );    

        await this.repository.create(attachment);

        const uploadUrl = await this.storageProvider.generateUploadUrl({
            bucket:attachment.bucket,
            key: attachment.key,
            contentType: attachment.file.contentType,
            expiresIn: this.storageConfig.expiration
        });
        
        return AttachmentMapper.toGenerateUploadResponse(attachment, uploadUrl,this.storageConfig.expiration);

    }
    
}