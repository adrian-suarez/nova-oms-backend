import { PrismaClient } from "@prisma/client";
import { RolesCatalog } from "../data/RolesCatalog.js";

export class RoleSeeder {
  constructor(private readonly prisma: PrismaClient) {}

  async seed(): Promise<void> {
    for (const role of RolesCatalog) {
      await this.prisma.role.upsert({
        where: {
          name: role.name,
        },

        update: {
          description: role.description,
        },

        create: role,
      });
    }
  }
}
