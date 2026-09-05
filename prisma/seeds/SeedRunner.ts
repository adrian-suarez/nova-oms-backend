import { PrismaClient } from "@prisma/client";
import { PermissionSeeder } from "./seeders/PermissionSeeder.js";
import { RolePermissionSeeder } from "./seeders/RolePermissionSeeder.js";
import { RoleSeeder } from "./seeders/RoleSeeder.js";
import { UserSeeder } from "./seeders/UserSeeder.js";
import { IdentityManagementProvider } from "@modules/auth/application/providers/IdentityManagementProvider.js";

export class SeedRunner {

    constructor(
        private readonly prisma: PrismaClient,
        private readonly identityManagementProvider?:IdentityManagementProvider
        
    ) {}

    async run(): Promise<void> {

        await new PermissionSeeder(this.prisma).seed();

        await new RoleSeeder(this.prisma).seed();

        await new RolePermissionSeeder(this.prisma).seed();

        await new UserSeeder(this.prisma,this.identityManagementProvider).seed();

    }

}