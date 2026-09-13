import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { RoleRepository } from "@modules/users/domain/repositories/RoleRepository.js";
import { Roles } from "@modules/users/domain/entities/Role.js";
import { ValidationError } from "@shared/errors/ValidationError.js";
import { EntityRequest } from "@shared/application/dto/EntityRequest.js";


export class DeleteRoleUseCase implements UseCase<EntityRequest,void>{

    constructor(private readonly repository: RoleRepository,
    ){}

    async execute(entityRequest:EntityRequest): Promise<void> {
        const role = await this.repository.findById(entityRequest.id);

        if(!role){
            throw new NotFoundError(`User: ${entityRequest.id}`);
        }

        if(role.name==Roles.ADMIN){
            throw new ValidationError("Cannot modify admin role");
        } 

        const count = await this.repository.countAssignedUsers(entityRequest.id);

        if(count){
            throw new ValidationError(`Cannot delete rol: ${entityRequest.id}, it has ${count} users`);
        }
        await this.repository.delete(entityRequest.id);

    }
    
}