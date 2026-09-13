import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { RoleRepository } from "@modules/users/domain/repositories/RoleRepository.js";
import { ConflictError } from "@shared/errors/ConflictError.js";
import { CreateRoleRequest } from "../../dto/requests/roles/CreateRoleRequest.js";
import { RolePermissionDetailResponse } from "../../dto/responses/RoleResponse.js";
import { Role } from "@modules/users/domain/entities/Role.js";
import { RoleMapper } from "../../mappers/RoleMapper.js";
import { PermissionValidator } from "../../services/PermissionValidatorService.js";
import { RolePermissionRepository } from "@modules/users/domain/repositories/RolePermissionRepository.js";


export class CreateRoleUseCase implements UseCase<CreateRoleRequest,RolePermissionDetailResponse>{

    constructor(
        private readonly roleRepository:RoleRepository,
        private readonly rolePermissionRepository:RolePermissionRepository,
        private readonly permissionValidator:PermissionValidator,
    ){}
    async execute(request: CreateRoleRequest): Promise<RolePermissionDetailResponse> {

        const exists = await this.roleRepository.findByName(request.name);
    
        if(exists){
            throw new ConflictError("Role already exists");
        }

        const role = Role.create({...request});

        await this.roleRepository.create(role);

        if(request.permissionsIds){
            const permissions = await this.permissionValidator.validate(request.permissionsIds)
            await this.rolePermissionRepository.assignMany(role.id, new Set(permissions.map(p=>p.id)));
        }

        return RoleMapper.toDetailResponse(role);

    }
    
}