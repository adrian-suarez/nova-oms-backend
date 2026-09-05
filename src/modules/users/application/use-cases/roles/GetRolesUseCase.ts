import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { PaginatedResponse } from "@shared/application/dto/ApiResponseBody.js";
import { PageResponseMapper } from "@shared/application/mappers/PageResponseMapper.js";
import { QueryOptionsMapper } from "@shared/application/factories/QueryOptionsFactory.js";
import { FilterBuilder } from "@shared/application/builders/FilterBuilder.js";
import { GetRolesRequest } from "../../dto/requests/roles/GetRolesRequest.js";
import { RoleSummaryResponse } from "../../dto/responses/RoleResponse.js";
import { RoleRepository } from "@modules/users/domain/repositories/RoleRepository.js";
import { RoleMapper } from "../../mappers/RoleMapper.js";


export class GetRolesUseCase implements UseCase<GetRolesRequest,PaginatedResponse<RoleSummaryResponse>>{

    constructor(private readonly repository: RoleRepository){}

    async execute(request:GetRolesRequest): Promise<PaginatedResponse<RoleSummaryResponse>> {

        const enabled = request.enabled != undefined ? request.enabled : true;     
        
        const filters = FilterBuilder.create()
        .eq("id",request.id)
        .eq("enabled",enabled)
        .build();

        const queryOptions = QueryOptionsMapper.map(request,filters)

        const page = await this.repository.findAll(queryOptions);

        return PageResponseMapper.map(page,RoleMapper.toSummaryResponse);
    }
    
}