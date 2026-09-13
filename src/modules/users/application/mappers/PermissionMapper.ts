
import { PermissionDetailResponse, PermissionSummaryResponse } from "../dto/responses/PermissionResponse.js";
import { Permission } from "@modules/users/domain/entities/Permission.js";

export class PermissionMapper {
    
    static toSummaryResponse(permission: Permission): PermissionSummaryResponse {
        return {
            id: permission.id!,
            name:permission.name
        }

    }
    static toDetailResponse(permission: Permission): PermissionDetailResponse {
        return {
            id: permission.id!,
            name:permission.name,
            description:permission.description
        }
    }

}