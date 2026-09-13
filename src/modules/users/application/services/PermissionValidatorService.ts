import { Permission } from "@modules/users/domain/entities/Permission.js";
import { PermissionRepository } from "@modules/users/domain/repositories/PermissionRepository.js";
import { ValidationError } from "@shared/errors/ValidationError.js";


export class PermissionValidator {
    constructor(private readonly repository:PermissionRepository){}

    async validate(permissionsIds?:string[]):Promise<Permission[]>{
        if(permissionsIds){

            const permissionsIdsSet = new Set(permissionsIds);
            const uniquePermissionsIds = [...permissionsIdsSet];
            const permissions = await this.repository.findByIds(uniquePermissionsIds);

            if( permissions.length!= uniquePermissionsIds.length){
                throw new ValidationError("Permissions not exists");
            }
            return permissions;
        }else{
            return [];
        }   
    }
}