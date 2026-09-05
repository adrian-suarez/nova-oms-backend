import { Permission } from "@modules/users/domain/entities/Permission.js";
import { Role } from "@modules/users/domain/entities/Role.js";
import { User, UserStatus } from "@modules/users/domain/entities/User.js";
import { User as UserModel, Role as RoleModel, Permission as PermissionModel} from "@prisma/client";
import { RoleModelWithPermissionModel, UserModelWithRoleModel } from "./types.js";

export function toPermissionEntity(data:PermissionModel ): Permission {
  return new Permission(data.id, data.name, data.description);
}
export function toRoleEntity(data: RoleModelWithPermissionModel | RoleModel): Role {
  return new Role(
    data.id,
    data.name,
    data.description,
    "permissions" in data ? data.permissions?.map(p => toPermissionEntity(p.permission)) ?? [] :[],
    data.enabled,
    data.version,
    data.createdAt,
    data.updatedAt,
    data.deletedAt
  );
}

export function toUserEntity(data: UserModelWithRoleModel | UserModel): User{
  return new User(
    data.id,
    data.email,
    data.firstName,
    data.lastName,
    data.status as UserStatus,
    "roles" in data ? data.roles?.map(r => toRoleEntity(r.role)) ?? [] : [],
    data.enabled,
    data.version,
    data.createdAt,
    data.updatedAt,
    data.deletedAt,
    data.password
  );
}