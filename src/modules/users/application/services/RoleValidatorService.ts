import { Role } from "@modules/users/domain/entities/Role.js";
import { RoleRepository } from "@modules/users/domain/repositories/RoleRepository.js";
import { ValidationError } from "@shared/errors/ValidationError.js";


export class RoleValidator {
    constructor(private readonly repository:RoleRepository){}

    async validate(rolesIds?:string[]):Promise<Role[]>{
        if(rolesIds){
            const rolesIdsSet = new Set(rolesIds);
            const uniqueRolesIds = [...rolesIdsSet];
            const roles = await this.repository.findByIds(uniqueRolesIds);

            if( roles.length!= uniqueRolesIds.length){
                throw new ValidationError("Roles not exists");
            }
            return roles;
        }else{
            return [];
        }   
    }
}