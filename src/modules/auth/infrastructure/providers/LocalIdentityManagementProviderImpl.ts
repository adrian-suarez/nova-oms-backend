import { User } from "@modules/users/domain/entities/User.js";
import { IdentityManagementProvider } from "@modules/auth/application/providers/IdentityManagementProvider.js";


export class LocalIdentityManagementProviderImpl implements IdentityManagementProvider{
    constructor(){}
  
    async create(_: User): Promise<string> {
        return "";
    }

    async update(_: User): Promise<void> {
    }
    async delete(_: string): Promise<void> {
        return;
    }
    async enable(_: string): Promise<void> {
        
    }
    async disable(_: string): Promise<void> {
       
    }
    async changePassword(_:string,__:string): Promise<void> {
    }
    
    
}