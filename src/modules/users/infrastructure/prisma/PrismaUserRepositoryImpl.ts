import { User } from "@modules/users/domain/entities/User.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { toUserEntity } from "./PrismaUserMapper.js";
import { Prisma } from "@prisma/client";
import { Page } from "@shared/domain/entities/Page.js";
import { QueryOptions } from "@shared/domain/entities/Query.js";
import { PrismaQueryConfiguration, PrismaQueryInterpreter } from "@shared/database/queries/PrismaQueryInterpreter.js";
import { ConflictError } from "@shared/errors/ConflictError.js";


const userQueryConfiguration : PrismaQueryConfiguration = {
  searchableFields:["firstName", "lastName" , "email"],
  sortableFields: ["createdAt"],
  fieldMap: {},
  defaultSortField:"createdAt"
}

export class PrismaUserRepositoryImpl implements UserRepository {
  constructor(readonly provider: PrismaProvider) {}

  async findAll(query:QueryOptions): Promise<Page<User>> {

    const args = PrismaQueryInterpreter.toFindManyArgs(query,userQueryConfiguration);

    const [data, total] = await Promise.all([
      this.provider.getClient().user.findMany(args),
      this.provider.getClient().user.count({where: args.where})
    ]);

    return new Page<User>(
      data.map(user=>toUserEntity(user)),
      query.pagination.page,
      query.pagination.pageSize,
      total
    );
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.provider.getClient().user.findUnique({ where: { id , enabled:true}});

    if (!user) {
      return null;
    }
    return toUserEntity(user);
  }

  async findWithRoles(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    const user = await this.provider.getClient().user.findUnique({ where ,include: {
        roles: {
          include: {
            role: {
              include: { permissions: {include:{permission:true}} }
            }
          }
        }
      }
    });

    if (!user) {
      return null;
    }
    return toUserEntity(user);
  }

  async findByIdWithRoles(id: string): Promise<User | null> {
    return this.findWithRoles({id, enabled:true});
  }
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.provider.getClient().user.findUnique({ where: { email} });

    if (!user) {
      return null;
    }
    return toUserEntity(user);
  }

  async findByEmailWithRole(email: string): Promise<User | null> {
    return this.findWithRoles({email, enabled:true});
  }
  async create(user: User): Promise<void> {
    await this.provider.getClient().user.create({
      data: {
        id:user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        status:user.status,
        enabled: user.enabled
      },
    });

  }

  // Optimistic locking: el WHERE incluye la versión leída por el caso de uso (ya
  // validada contra la del cliente) — si otra escritura concurrente ya avanzó la
  // versión, este UPDATE no afecta filas y Prisma tira P2025, capturado abajo
  // como ConflictError. Ver docs/decisions/0010-concurrency-control-optimistic-vs-pessimistic.md
  async update(user: User): Promise<void> {
    try {
      await this.provider.getClient().user.update({
        where: { id: user.id, version: user.version },
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          enabled: user.enabled,
          version: {increment: 1}
        }
      });
      user.version++;
    } catch (error) {
      if(error instanceof Prisma.PrismaClientKnownRequestError && error.code ==="P2025"){
        throw new ConflictError(`User ${user.id} was modified by another request`);
      }
      throw error;
    }
   
  }
  async setCognitoSub(id: string, cognitoSub: string): Promise<void> {
    await this.provider.getClient().user.update({
      where: { id },
      data: { cognitoSub }
    });
  }

  async delete(id: string, force?:boolean): Promise<void> {

    if(force){
      await this.provider.getClient().userRole.deleteMany({where:{userId:id}});
      await this.provider.getClient().user.delete({where:{id}});
    }else{
      await this.provider.getClient().user.update({data:{deletedAt: new Date(), enabled:false}, where:{id}});
    }
    
  }
}
