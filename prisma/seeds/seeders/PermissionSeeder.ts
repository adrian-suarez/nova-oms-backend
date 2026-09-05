import { PrismaClient } from "@prisma/client";
import { PermissionCatalog } from "../data/PermissionsCatalog.js";

export class PermissionSeeder {
  constructor(private readonly prisma: PrismaClient) {}

  async seed(): Promise<void> {
    for (const permission of PermissionCatalog) {
      await this.prisma.permission.upsert({
        where: {
          name: permission.name,
        },

        update: {
          description: permission.description,
        },

        create: permission,
      });
    }
  }
}
