import { RolePermissionDetailResponse, RoleSummaryResponse } from "./RoleResponse.js";


export interface UserSummaryResponse {
    id: string;
    email:string;
    firstName:string;
    lastName:string;
    status:string;
    enabled:boolean;
    version: number;

}

export interface UserDetailResponse {
    id: string;
    email:string;
    firstName:string;
    lastName:string;
    status:string;
    enabled:boolean;
    version: number;
    roles?: RoleSummaryResponse[];

    createdAt:Date;
    updatedAt?:Date| null;
    deletedAt?:Date|null;
}

export interface UserRoleDetailResponse {
    id: string;
    email:string;
    firstName:string;
    lastName:string;
    roles?:RolePermissionDetailResponse[];
    status:string;
    enabled:boolean;
    version: number;

    createdAt:Date;
    updatedAt?:Date| null;
    deletedAt?:Date|null;
}