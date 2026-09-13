import { User } from "@modules/users/domain/entities/User.js";
import { UserIdentity } from "../../../auth/domain/entities/AuthUser.js";
import { JwtClaims } from "@shared/security/jwt/JwtClaims.js";
import { UserDetailResponse, UserRoleDetailResponse, UserSummaryResponse } from "../dto/responses/UserResponse.js";
import { RoleMapper } from "./RoleMapper.js";

export class UserMapper {
    static toDetailResponse(user: User): UserDetailResponse {
        const userResponse:UserDetailResponse =  {
            id: user.id!,
            email:user.email,
            firstName:user.firstName,
            lastName:user.lastName,
            status: user.status,
            enabled: user.enabled,
            version: user.version,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt
        }

        if(user.roles && user.roles.length>0){
            userResponse.roles = user.roles.map(r=>RoleMapper.toSummaryResponse(r));
        }

        return userResponse;
    }

    static toRoleDetailResponse(user: User): UserRoleDetailResponse {
        const userResponse:UserRoleDetailResponse =  {
            id: user.id!,
            email:user.email,
            firstName:user.firstName,
            lastName:user.lastName,
            status: user.status,
            enabled: user.enabled,
            version: user.version,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt
        }

        if(user.roles && user.roles.length>0){
            userResponse.roles = user.roles.map(r=>RoleMapper.toDetailResponse(r));
        }

        return userResponse;
    }

     static toSummaryResponse(user: User): UserSummaryResponse {
        const userResponse:UserSummaryResponse =  {
            id: user.id!,
            email:user.email,
            firstName:user.firstName,
            lastName:user.lastName,
            status: user.status,
            enabled: user.enabled,
            version: user.version,
        }
        return userResponse;
    }

    static toAuthUserEntity(user:User):UserIdentity{
        return {
            sub: user.id!,
            email: user.email
        }
    }

    static toJwtClaims(user:User):JwtClaims{
        return {
            sub: user.id,
            email:user.email
        }
    }
    
}