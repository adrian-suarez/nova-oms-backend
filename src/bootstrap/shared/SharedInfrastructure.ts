import { PrismaUserSessionRepositoryImpl } from "@modules/auth/infrastructure/repositories/PrismaUserSessionRepositoryImpl.js";
import { SharedContainer } from "./SharedContainer.js";
import { PrismaUserRepositoryImpl } from "@modules/users/infrastructure/prisma/PrismaUserRepositoryImpl.js";
import { PrismaRoleRepositoryImpl } from "@modules/users/infrastructure/prisma/PrismaRoleRepositoryImpl.js";
import { PrismaIdentityRepositoryImpl } from "@modules/auth/infrastructure/repositories/PrismaIdentityRepositoryImpl.js";
import { PrismaPermissionRepositoryImpl } from "@modules/users/infrastructure/prisma/PrismaPermissionRepositoryImpl.js";
import { RoleValidator } from "@modules/users/application/services/RoleValidatorService.js";
import { PrismaUserRoleRepositoryImpl } from "@modules/users/infrastructure/prisma/PrismaUserRoleRepositoryImpl.js";
import { PermissionValidator } from "@modules/users/application/services/PermissionValidatorService.js";
import { PrismaRolePermissionRepositoryImpl } from "@modules/users/infrastructure/prisma/PrismaRolePermissionRepositoryImpl.js";
import { PrismaIdempotencyRepositoryImpl } from "@shared/infrastructure/repositories/PrismaIdempotencyRepositoryImpl.js";



export class SharedInfrastructure{

    readonly userRepository;
    readonly roleRepository;
    readonly userRoleRepository;
    readonly roleValidator;
    readonly rolePermissionRepository;
    readonly permissionValidator;
    readonly permissionRepository;
    readonly userSessionRepository;
    readonly identityRepository;
    readonly idempotencyRepository;

    constructor(container:SharedContainer){
        this.userSessionRepository = new PrismaUserSessionRepositoryImpl(container.prismaProvider);
        this.userRepository = new PrismaUserRepositoryImpl(container.prismaProvider);
        this.roleRepository = new PrismaRoleRepositoryImpl(container.prismaProvider);
        this.userRoleRepository = new PrismaUserRoleRepositoryImpl(container.prismaProvider);
        this.roleValidator = new RoleValidator(this.roleRepository);
        this.permissionRepository = new PrismaPermissionRepositoryImpl(container.prismaProvider);
        this.rolePermissionRepository = new PrismaRolePermissionRepositoryImpl(container.prismaProvider);
        this.permissionValidator = new PermissionValidator(this.permissionRepository);
        this.identityRepository = new PrismaIdentityRepositoryImpl(container.prismaProvider);
        this.idempotencyRepository = new PrismaIdempotencyRepositoryImpl(container.prismaProvider);
    }

}
