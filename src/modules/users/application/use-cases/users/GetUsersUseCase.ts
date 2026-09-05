import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { UserMapper } from "../../mappers/UserMapper.js";
import { UserSummaryResponse } from "../../dto/responses/UserResponse.js";
import { PaginatedResponse } from "@shared/application/dto/ApiResponseBody.js";
import { GetUsersRequest } from "../../dto/requests/users/GetUsersRequest.js";
import { PageResponseMapper } from "@shared/application/mappers/PageResponseMapper.js";
import { QueryOptionsMapper } from "@shared/application/factories/QueryOptionsFactory.js";
import { FilterBuilder } from "@shared/application/builders/FilterBuilder.js";


export class GetUsersUseCase implements UseCase<GetUsersRequest,PaginatedResponse<UserSummaryResponse>>{

    constructor(private readonly repository: UserRepository){}

    async execute(request:GetUsersRequest): Promise<PaginatedResponse<UserSummaryResponse>> {

        const enabled = request.enabled != undefined ? request.enabled : true;     
        
        const filters = FilterBuilder.create()
        .eq("id",request.id)
        .eq("enabled",enabled)
        .eq("status",request.status)
        .eq("roleId",request.roleId)
        .build();

        const queryOptions = QueryOptionsMapper.map(request,filters)

        const page = await this.repository.findAll(queryOptions);

        return PageResponseMapper.map(page,UserMapper.toSummaryResponse);
    }
    
}