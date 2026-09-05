import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { RoleRepository } from "@modules/users/domain/repositories/RoleRepository.js";
import { RolePermissionDetailResponse } from "../../dto/responses/RoleResponse.js";
import { RoleMapper } from "../../mappers/RoleMapper.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { EntityRequest } from "@shared/application/dto/EntityRequest.js";


export class GetRoleUseCase implements UseCase<EntityRequest,RolePermissionDetailResponse>{

    constructor(private readonly repository: RoleRepository){}

    async execute(entityRequest:EntityRequest): Promise<RolePermissionDetailResponse> {
        const role = await this.repository.findByIdWithPermissions(entityRequest.id);

        if(!role){
            throw new NotFoundError(`Role: ${entityRequest.id}`);
        }
        return RoleMapper.toDetailResponse(role);
    }
    
}