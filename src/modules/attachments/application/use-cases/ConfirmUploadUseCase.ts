
import { AttachmentRepository } from "@modules/attachments/domain/repositories/AttachmentRepository.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { StorageRequest } from "../dto/request/StorageRequest.js";
import { ConfirmUploadResponse } from "../dto/response/ConfirmUploadResponse.js";
import { AttachmentMapper } from "../mappers/AttachmentMapper.js";
import { StorageProvider } from "../providers/StorageProvider.js";
import { StorageConfig } from "@shared/config/StorageConfig.js";
import { ValidationError } from "@shared/errors/ValidationError.js";
import {fileTypeFromBuffer} from "file-type"
import { Attachment, AttachmentStatus } from "@modules/attachments/domain/entities/Attachment.js";
import { Logger } from "@shared/logger/Logger.js";
import { DomainEventDispatcher } from "@shared/application/orchestration/DomainEventDispatcher.js";

export class ConfirmUploadUseCase implements UseCase<StorageRequest,ConfirmUploadResponse|null>{

    constructor(
        private readonly repository:AttachmentRepository,
        private readonly storageProvider:StorageProvider,
        private readonly storageConfig:StorageConfig,
        private readonly domainEventDispatcher:DomainEventDispatcher,
        private readonly logger:Logger
    ){}
    async execute(request: StorageRequest): Promise<ConfirmUploadResponse|null> {
        
        let attachment:Attachment | null = null;

        try{
            attachment = await this.repository.findByKey(request.key);    
            if(!attachment){
                throw new NotFoundError(`Attachment: ${request.key}.`);
            } 

            const data = await this.storageProvider.getObjectRange(request,0,4100);
            const detected = await fileTypeFromBuffer(data);

            if(!detected || !this.storageConfig.allowedContentTypes.has(detected.mime)){
                throw new ValidationError(`Invalid Type: ${detected?.mime ?? "empty"}`);
            }

            if(attachment.file.contentType != detected.mime){
                throw new ValidationError(`Incorrect Type: ${detected.mime} != ${attachment.file.contentType}`);
            }

            attachment.confirmUpload();
            this.logger.info("Attachment uploaded",{attachment});

            await this. domainEventDispatcher.dispatcher(attachment,
               async ()=> await this.repository.update(attachment!)
            );

            return AttachmentMapper.toConfirmResponse(attachment);

        }catch(error){
            this.logger.error("Confirm Upload use case error",{error});

            await this.storageProvider.delete(request);
            if(attachment){
                const msg = error instanceof ValidationError ? error.message :"";
                attachment.fail(msg);
                await this. domainEventDispatcher.dispatcher(attachment,
                    async ()=> await this.repository.update(attachment!)
                );

            }
            return  {key:request.key,status:AttachmentStatus.FAILED};

        }

    }
    
}