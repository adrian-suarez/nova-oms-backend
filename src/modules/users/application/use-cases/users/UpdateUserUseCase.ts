import { IdentityManagementProvider } from "@modules/auth/application/providers/IdentityManagementProvider.js";
import { Role } from "@modules/users/domain/entities/Role.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { UserRoleRepository } from "@modules/users/domain/repositories/UserRoleRepository.js";
import { DomainEventDispatcher } from "@shared/application/orchestration/DomainEventDispatcher.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { ValidationError } from "@shared/errors/ValidationError.js";
import { UpdateUserRequest } from "../../dto/requests/users/UpdateUserRequest.js";
import { UserDetailResponse } from "../../dto/responses/UserResponse.js";
import { UserMapper } from "../../mappers/UserMapper.js";
import { RoleValidator } from "../../services/RoleValidatorService.js";
import { ConflictError } from "@shared/errors/ConflictError.js";


export class UpdateUserUseCase implements UseCase<UpdateUserRequest,UserDetailResponse>{

    constructor(private readonly repository: UserRepository,
        private readonly userRoleRepository: UserRoleRepository,
        private readonly roleValidator: RoleValidator,
        private readonly identityManagementProvider: IdentityManagementProvider,
        private readonly domainEventDispatcher:DomainEventDispatcher
        
    ){}

    async execute(request: UpdateUserRequest): Promise<UserDetailResponse> {
        let user = await this.repository.findById(request.id);
        if(!user){
            throw new NotFoundError(`User: ${request.id}`);
        } 

        // La versión comparada acá es la que el cliente declaró haber visto (request.version).
        // Este chequeo no es atómico por sí solo — dos requests concurrentes pueden pasarlo
        // ambas con la misma versión leída. La protección real está en el WHERE id, version
        // atómico de repository.update() (ver ADR-0010); esto solo da un error más rápido
        // y claro que esperar al P2025 de Prisma.
        if(user.version !== request.version){
            throw new ConflictError(`User ${user.id} was modified since it was last read`);
        }

        let isUpdated = user.update({...request});

        let roles: Role[] = [];
        if (request.rolesIds) {
            roles = await this.roleValidator.validate(request.rolesIds);
            user.setRoles(roles);
            isUpdated = true;
        }

         if(!isUpdated){
            throw new ValidationError("No fields to update");
        }

        if(user.requiresIdentitySync(request)){
            await this.identityManagementProvider.update(user);
        }
        
        await this.domainEventDispatcher.dispatcher(user,async () => {
            await this.repository.update(user);
            if (request.rolesIds) {
                await this.userRoleRepository.sync(user.id, new Set(roles.map(r => r.id)));
            }
        });


        return UserMapper.toDetailResponse(user);

    }
    
}