import { AttachmentRepository } from "@modules/attachments/domain/repositories/AttachmentRepository.js";
import { EntityRequest } from "@shared/application/dto/EntityRequest.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { AttachmentMapper } from "../mappers/AttachmentMapper.js";
import { AttachmentDetailResponse } from "../dto/response/AttachmentDetailResponse.js";


export class GetAttachmentUseCase implements UseCase<EntityRequest,AttachmentDetailResponse>{

    constructor(   private readonly repository:AttachmentRepository){}

    async execute(request:EntityRequest): Promise<AttachmentDetailResponse> {
        const attachment = await this.repository.findById(request.id);

        if(!attachment){
            throw new NotFoundError(`Attachment: ${request.id}`);
        }
        return AttachmentMapper.toDetailResponse(attachment);
    }
    
}