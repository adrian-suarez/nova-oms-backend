
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { RolePermissionRepository } from "@modules/users/domain/repositories/RolePermissionRepository.js";

export class PrismaRolePermissionRepositoryImpl implements RolePermissionRepository {
  constructor(readonly provider: PrismaProvider) {}
  async assignMany(roleId: string, permissionsIds: Set<string>): Promise<void> {

    if(permissionsIds.size===0){
      return;
    }

    await this.provider.getClient().rolePermission.createMany({
      data:[...permissionsIds].map(permissionId => ({
        roleId,
        permissionId
      }))
    });
     
  }
  async removeMany(roleId: string, permissionsIds: Set<string>): Promise<void> {
    
    if(permissionsIds.size===0){
      return;
    }

    await this.provider.getClient().rolePermission.deleteMany({
      where:{
        roleId,
        permissionId :{
          in: [...permissionsIds] 
        }
      }});
  }
  async sync(roleId: string, permissionsIds: Set<string>): Promise<void> {
    
    const currentIds = await this.findPermissionsIds(roleId);

    const toAssign = [...permissionsIds].filter(r=> !currentIds.has(r));
    const toUnassign = [...currentIds].filter(r=> !permissionsIds.has(r));

    await Promise.all([
      this.provider.getClient().rolePermission.createMany({
        data:toAssign.map(permissionId => ({
          roleId,
          permissionId
        }))
      }),
      this.provider.getClient().rolePermission.deleteMany({
        where:{
            roleId,
            permissionId :{
              in: toUnassign 
            }
          }
        })
    ]);

  }
  async findPermissionsIds(roleId: string): Promise<Set<string>> {
    const rolePermissions = await this.provider.getClient().rolePermission.findMany({where:{roleId}, select:{permissionId:true}});
    return new Set (rolePermissions.map(ur => ur.permissionId));
  }

}
