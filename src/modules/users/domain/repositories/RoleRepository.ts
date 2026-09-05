import { QueryOptions } from "@shared/domain/entities/Query.js";
import { Role } from "../entities/Role.js";
import { Page } from "@shared/domain/entities/Page.js";


export interface RoleRepository{
    create(role:Role):Promise<void>;
    update(role:Role):Promise<void>;
    findAll(query: QueryOptions):Promise<Page<Role>>;
    findById(id:string):Promise<Role|null>;
    findByIds(ids:string[]):Promise<Role[]>;
    findByName(name:string):Promise<Role|null>;
    findByIdWithPermissions(id:string): Promise<Role | null>;
    delete(id:string):Promise<void>;
    countAssignedUsers(roleId:string): Promise<number>;

}