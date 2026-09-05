
export interface UserRoleRepository{
    assignMany(userId: string, rolesIds: Set<string>):Promise<void>;
    removeMany(userId: string, rolesIds: Set<string>):Promise<void>;
    sync(userId: string, rolesIds: Set<string>):Promise<void>;
}