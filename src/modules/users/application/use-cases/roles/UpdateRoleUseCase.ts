import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { RoleRepository } from "@modules/users/domain/repositories/RoleRepository.js";
import { ValidationError } from "@shared/errors/ValidationError.js";
import { RolePermissionDetailResponse } from "../../dto/responses/RoleResponse.js";
import { UpdateRoleRequest } from "../../dto/requests/roles/UpdateRoleRequest.js";
import { RoleMapper } from "../../mappers/RoleMapper.js";
import { Roles } from "@modules/users/domain/entities/Role.js";
import { RolePermissionRepository } from "@modules/users/domain/repositories/RolePermissionRepository.js";
import { PermissionValidator } from "../../services/PermissionValidatorService.js";
import { ConflictError } from "@shared/errors/ConflictError.js";


export class UpdateRoleUseCase implements UseCase<UpdateRoleRequest,RolePermissionDetailResponse>{

    constructor(private readonly repository: RoleRepository,
        private readonly rolePermissionRepository:RolePermissionRepository,
        private readonly permissionValidator:PermissionValidator,
    ){}

    async execute(request: UpdateRoleRequest): Promise<RolePermissionDetailResponse> {
        const role = await this.repository.findById(request.id);
        if(!role){
            throw new NotFoundError(`Role: ${request.id}`);
        } 

        if(role.name==Roles.ADMIN){
            throw new ValidationError("Cannot modify admin role");
        }
        
        // La versión comparada acá es la que el cliente declaró haber visto (request.version).
        // Este chequeo no es atómico por sí solo — dos requests concurrentes pueden pasarlo
        // ambas con la misma versión leída. La protección real está en el WHERE id, version
        // atómico de repository.update() (ver ADR-0010); esto solo da un error más rápido
        // y claro que esperar al P2025 de Prisma.
        if(role.version !== request.version){
            throw new ConflictError(`Role ${role.id} was modified since it was last read`);
        }

        const isUpdated=role.update({...request}) || request.permissionsIds;

        if(!isUpdated){
            throw new ValidationError("Not fields to update");
        }

        await this.repository.update(role);

        if(request.permissionsIds){
            const permissions = await this.permissionValidator.validate(request.permissionsIds)

            role.setPermissions(permissions);

            await this.rolePermissionRepository.sync(role.id,new Set(permissions.map(p=>p.id)));

        }

        return RoleMapper.toDetailResponse(role);

    }
    
}