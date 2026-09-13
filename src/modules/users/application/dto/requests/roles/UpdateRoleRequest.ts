
export interface UpdateRoleRequest {
    id:string,
    name?:string;
    description?:string;
    enabled?:boolean;
    permissionsIds?:string[];
    version: number;
}