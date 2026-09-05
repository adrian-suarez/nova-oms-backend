
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { UserRoleRepository } from "@modules/users/domain/repositories/UserRoleRepository.js";

export class PrismaUserRoleRepositoryImpl implements UserRoleRepository {
  constructor(readonly provider: PrismaProvider) {}
  async assignMany(userId: string, rolesIds: Set<string>): Promise<void> {

    if(rolesIds.size===0){
      return;
    }

    await this.provider.getClient().userRole.createMany({
      data:[...rolesIds].map(roleId => ({
        userId,
        roleId
      }))
    });
     
  }
  async removeMany(userId: string, rolesIds: Set<string>): Promise<void> {
    
    if(rolesIds.size===0){
      return;
    }

    await this.provider.getClient().userRole.deleteMany({
      where:{
        userId,
        roleId :{
          in: [...rolesIds] 
        }
      }});
  }
  async sync(userId: string, rolesIds: Set<string>): Promise<void> {
    
    const currentIds = await this.findRoleIds(userId);

    const toAssign = [...rolesIds].filter(r=> !currentIds.has(r));
    const toUnassign = [...currentIds].filter(r=> !rolesIds.has(r));

    await Promise.all([
      this.provider.getClient().userRole.createMany({
        data:toAssign.map(roleId => ({
          userId,
          roleId
        }))
      }),
      this.provider.getClient().userRole.deleteMany({
        where:{
            userId,
            roleId :{
              in: toUnassign 
            }
          }
        })
    ]);

  }
  async findRoleIds(userId: string): Promise<Set<string>> {
    const userRoles = await this.provider.getClient().userRole.findMany({where:{userId}, select:{roleId:true}});
    return new Set (userRoles.map(ur => ur.roleId));
  }

}
