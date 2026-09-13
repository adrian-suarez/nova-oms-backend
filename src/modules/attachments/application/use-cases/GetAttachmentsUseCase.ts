import { AttachmentRepository } from "@modules/attachments/domain/repositories/AttachmentRepository.js";
import { EntityRequest } from "@shared/application/dto/EntityRequest.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { GetAttachmentsRequest } from "../dto/request/GetAttachmentsRequest.js";
import { AttachmentDetailResponse } from "../dto/response/AttachmentDetailResponse.js";
import { AttachmentMapper } from "../mappers/AttachmentMapper.js";
import { FilterBuilder } from "@shared/application/builders/FilterBuilder.js";
import { QueryOptionsMapper } from "@shared/application/factories/QueryOptionsFactory.js";
import { PageResponseMapper } from "@shared/application/mappers/PageResponseMapper.js";
import { PaginatedResponse } from "@shared/application/dto/ApiResponseBody.js";


export class GetAttachmentsUseCase implements UseCase<EntityRequest,PaginatedResponse<AttachmentDetailResponse>>{

    constructor(   private readonly repository:AttachmentRepository){}

    async execute(request:GetAttachmentsRequest): Promise<PaginatedResponse<AttachmentDetailResponse>> {
       
        const enabled = request.enabled != undefined ? request.enabled : true;     
        
        const filters = FilterBuilder.create()
        .eq("id",request.id)
        .eq("enabled",enabled)
        .eq("status",request.status)
        .eq("uploadedById",request.uploadedById)
        .build();

        const queryOptions = QueryOptionsMapper.map(request,filters)

        const page = await this.repository.findAll(queryOptions);

        return PageResponseMapper.map(page,AttachmentMapper.toDetailResponse);
    }
    
}