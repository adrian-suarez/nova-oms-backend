
export interface RolePermissionRepository{
    assignMany(roleId:string, permissionsIds:Set<string>):Promise<void>;
    removeMany(roleId:string, permissionsIds:Set<string>):Promise<void>;
    sync(roleId:string, permissionsIds:Set<string>):Promise<void>;

}