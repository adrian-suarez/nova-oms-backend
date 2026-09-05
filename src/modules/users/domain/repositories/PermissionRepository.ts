import { Permission } from "../entities/Permission.js";


export interface PermissionRepository{
    findAll():Promise<Permission[]>;
    findByIds(ids:string[]):Promise<Permission[]>;

}