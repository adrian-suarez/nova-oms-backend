
import { Role } from "@modules/users/domain/entities/Role.js";
import { RolePermissionDetailResponse, RoleSummaryResponse } from "../dto/responses/RoleResponse.js";
import { PermissionMapper } from "./PermissionMapper.js";

export class RoleMapper {
    
    static toSummaryResponse(role: Role): RoleSummaryResponse {
        return {
            id: role.id!,
            name:role.name
        }
    }

    static toDetailResponse(role: Role): RolePermissionDetailResponse {
        const roleResponse:RolePermissionDetailResponse =  {
            id: role.id!,
            name:role.name,
            description:role.description,
            enabled: role.enabled,
            version: role.version,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            deletedAt: role.deletedAt
        }

        if(role.permissions && role.permissions.length>0){
            roleResponse.permissions = role.permissions.map(p=>PermissionMapper.toDetailResponse(p));
        }

        return roleResponse;
    }

}