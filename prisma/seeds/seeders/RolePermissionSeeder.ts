import { PrismaClient } from "@prisma/client";
import { RolePermissionCatalog } from "../data/RolesCatalog.js";

export class RolePermissionSeeder {
  constructor(private readonly prisma: PrismaClient) {}

  async seed(): Promise<void> {
    const roles = await this.prisma.role.findMany();

    const permissions = await this.prisma.permission.findMany();

    const roleMap = new Map(roles.map((r) => [r.name, r.id]));

    const permissionMap = new Map(permissions.map((p) => [p.name, p.id]));

    for (const [roleName, definitions] of Object.entries(RolePermissionCatalog)) {
      const roleId = roleMap.get(roleName);

      if (!roleId) continue;

      for (const permission of definitions) {
        const permissionId = permissionMap.get(permission.name);

        if (!permissionId) continue;

        await this.prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,

              permissionId,
            },
          },

          update: {},

          create: {
            roleId,

            permissionId,
          },
        });
      }
    }
  }
}
