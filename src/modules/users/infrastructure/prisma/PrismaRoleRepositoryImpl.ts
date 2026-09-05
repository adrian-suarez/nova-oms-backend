import { Role } from "@modules/users/domain/entities/Role.js";
import { RoleRepository } from "@modules/users/domain/repositories/RoleRepository.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { toRoleEntity } from "./PrismaUserMapper.js";
import { QueryOptions } from "@shared/domain/entities/Query.js";
import { PrismaQueryConfiguration, PrismaQueryInterpreter } from "@shared/database/queries/PrismaQueryInterpreter.js";
import { Page } from "@shared/domain/entities/Page.js";
import { Prisma } from "@prisma/client";
import { ConflictError } from "@shared/errors/ConflictError.js";

const roleQueryConfiguration : PrismaQueryConfiguration = {
  searchableFields:["name"],
  sortableFields: ["name"],
  fieldMap: {},
  defaultSortField:"name"
}


export class PrismaRoleRepositoryImpl implements RoleRepository {
  constructor(readonly provider: PrismaProvider) {}
 

  async findByIds(ids: string[]): Promise<Role[]> {
    const roles = await this.provider.getClient().role.findMany({where:{id:{in:ids}, enabled:true},orderBy: { createdAt: "desc" } });
    return roles.map((role) => toRoleEntity(role));
  }
 async findByName(name: string): Promise<Role | null> {
   const role = await this.provider.getClient().role.findUnique({ where: { name} });

    if (!role) {
      return null;
    }

    return toRoleEntity(role);
  }
  
  async findAll(query: QueryOptions): Promise<Page<Role>> {
    const args = PrismaQueryInterpreter.toFindManyArgs(query,roleQueryConfiguration);

    const [data, total] = await Promise.all([
        this.provider.getClient().role.findMany(args),
        this.provider.getClient().role.count({where: args.where})
      ]);
  
    return new Page<Role>(
      data.map(role=>toRoleEntity(role)),
      query.pagination.page,
      query.pagination.pageSize,
      total
    );
  }
  async findById(id: string): Promise<Role | null> {
    const role = await this.provider.getClient().role.findUnique({ where: { id , enabled:true} });

    if (!role) {
      return null;
    }

    return toRoleEntity(role);
  }

  async findByIdWithPermissions(id:string): Promise<Role | null> {
      const user = await this.provider.getClient().role.findUnique({ where:{id, enabled:true} ,include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });
  
      if (!user) {
        return null;
      }
      return toRoleEntity(user);
    }
  
  async create(role: Role): Promise<void> {
    await this.provider.getClient().role.create({
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        enabled: role.enabled
      },
    });
  }

  // Optimistic locking: el WHERE incluye la versión leída por el caso de uso (ya
  // validada contra la del cliente) — si otra escritura concurrente ya avanzó la
  // versión, este UPDATE no afecta filas y Prisma tira P2025, capturado abajo
  // como ConflictError. Ver docs/decisions/0010-concurrency-control-optimistic-vs-pessimistic.md
  async update(role: Role): Promise<void> {
    try{
      await this.provider.getClient().role.update({
        where: { id: role.id, version: role.version },
        data: {
          name: role.name,
          description: role.description,
          enabled: role.enabled,
          version: {increment: 1}
        }
      });
      role.version++;
    } catch (error) {
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code ==="P2025"){
        throw new ConflictError(`Role ${role.id} was modified by another request`);
      }
      throw error;
    }
  }
  async delete(id: string): Promise<void> {
    await this.provider.getClient().role.update({data:{deletedAt: new Date(), enabled:false}, where:{id}});
  }
  async countAssignedUsers(roleId: string): Promise<number> {
    return await this.provider.getClient().userRole.count({where:{roleId}});
  }
}
