

export interface CreateRoleRequest {
    name:string;
    description:string;
    permissionsIds?:string[];
}