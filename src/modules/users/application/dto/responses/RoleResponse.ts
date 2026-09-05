import { PermissionDetailResponse } from "./PermissionResponse.js";

export interface RolePermissionDetailResponse {
    id: string;
    name:string;
    description:string;
    permissions?:PermissionDetailResponse[];
    enabled:boolean;
    version: number;

    createdAt:Date;
    updatedAt?:Date| null;
    deletedAt?:Date|null;
}

export interface RoleSummaryResponse {
    id: string;
    name:string;
}