import { AttachmentRepository } from "@modules/attachments/domain/repositories/AttachmentRepository.js";
import { EntityRequest } from "@shared/application/dto/EntityRequest.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { StorageProvider } from "../providers/StorageProvider.js";
import { DomainEventDispatcher } from "@shared/application/orchestration/DomainEventDispatcher.js";


export class DeleteAttachmentUseCase implements UseCase<EntityRequest,void>{

    constructor(   private readonly repository:AttachmentRepository,
        private readonly storageProvider:StorageProvider,
        private readonly domainEventDispatcher:DomainEventDispatcher
    ){}

    async execute(request:EntityRequest): Promise<void> {
        const attachment = await this.repository.findById(request.id);
        if(!attachment){
            throw new NotFoundError(`Attachment: ${request.id}.`);
        } 
        
        const exists = await this.storageProvider.exists({bucket:attachment.bucket,key:attachment.key});
        if(!exists){
            throw new NotFoundError("Attachment upload was not completed.");
        }
        attachment.delete(); 
        await this.storageProvider.delete({bucket:attachment.bucket,key:attachment.key});

        await this.domainEventDispatcher.dispatcher(attachment, async () => {
            await this.repository.update(attachment);
        });

    }
    
}