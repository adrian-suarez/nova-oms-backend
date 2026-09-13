import { Prisma } from "@prisma/client";

export type UserModelWithRoleModel = Prisma.UserGetPayload<{
  include:{
    roles:{
      include:{
        role:{
          include:{
            permissions:{
              include:{
                permission:true
              }
            }
          }
        }
      }
    }
  }
}>;

export type RoleModelWithPermissionModel = Prisma.RoleGetPayload<{
    include:{
        permissions:{
            include:{
                permission:true
            }
        }
    }   
}>;
