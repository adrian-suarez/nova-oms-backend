import { UserIdentity, AuthenticatedUser } from "@modules/auth/domain/entities/AuthUser.js";
import { IdentityRepository } from "@modules/auth/domain/repositories/IdentityRepository.js";
import { UserModelWithRoleModel } from "@modules/users/infrastructure/prisma/types.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";

export class PrismaIdentityRepositoryImpl implements IdentityRepository {
  constructor(readonly provider: PrismaProvider) {}

  async load(user: UserIdentity): Promise<AuthenticatedUser> {
    const entity = await this.provider.getClient().user.findUnique({
      where: { email: user.email },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    return this.toAuthUserEntity(entity!);
  }

  private toAuthUserEntity(user: UserModelWithRoleModel): AuthenticatedUser {
    return new AuthenticatedUser(
      user.id!,
      user.email!,
      user.firstName,
      user.lastName,
      user.roles.map((r) => ({id: r.role.id, name: r.role.name})),
      user.roles.flatMap((r) => r.role.permissions).map((p) => ({id: p.permission.id, name: p.permission.name})),
    );
  }
}
