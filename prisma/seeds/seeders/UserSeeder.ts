import { PrismaClient } from "@prisma/client";
import { PASSWORD_HASH, UserCatalog } from "../data/UsersCatalog.js";
import { IdentityManagementProvider } from "@modules/auth/application/providers/IdentityManagementProvider.js";
import { User, UserStatus } from "@modules/users/domain/entities/User.js";

export class UserSeeder {
  constructor(private readonly prisma: PrismaClient,
    private readonly identityManagementProvider?:IdentityManagementProvider
  ) {}

  async seed(): Promise<void> {
    const roles = await this.prisma.role.findMany();

    const roleMap = new Map(roles.map((r) => [r.name, r.id]));

    for (const user of UserCatalog) {
      const roleId = roleMap.get(user.role);

      const created = await this.prisma.user.upsert({
        where: { email: user.email},
        update: {},
        create: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: UserStatus.ACTIVE,
          enabled: true,
          ...(!this.identityManagementProvider && {password: PASSWORD_HASH}),
          roles: { create: [ { role:{connect: {id: roleId}}}]}
        },
      });

      if(this.identityManagementProvider){
        const realUser = new User(
          created.id,
          created.email,
          created.firstName,
          created.lastName,
          created.status as UserStatus,
          [],
          created.enabled,
          created.version,
          created.createdAt,
          created.updatedAt,
          created.deletedAt,
          "Nova*123",
        );

        await this.identityManagementProvider.create(
          realUser
        );
      }
    }
  }
}
