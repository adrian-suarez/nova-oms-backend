import { Permission } from "@modules/users/domain/entities/Permission.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { PermissionRepository } from "@modules/users/domain/repositories/PermissionRepository.js";
import { toPermissionEntity } from "./PrismaUserMapper.js";


export class PrismaPermissionRepositoryImpl implements PermissionRepository {
  constructor(readonly provider: PrismaProvider) {}

  async findByIds(ids: string[]): Promise<Permission[]> {
    const entities = await this.provider.getClient().permission.findMany({where:{id:{in:ids}},orderBy: { name: "asc" } });
    return entities.map((entity) => toPermissionEntity(entity));
  }
  async findAll(): Promise<Permission[]> {
    const entities = await this.provider.getClient().permission.findMany({ orderBy: { name: "asc" } });
    return entities.map((entity) => toPermissionEntity(entity));
  }
}
