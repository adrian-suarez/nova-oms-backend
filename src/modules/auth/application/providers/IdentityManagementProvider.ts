
import { User } from "@modules/users/domain/entities/User.js";

export interface IdentityManagementProvider {
    create(user: User):Promise<void>;
    update(user: User):Promise<void>;
    delete(userId: string):Promise<void>;
    enable(userId: string):Promise<void>;
    disable(userId: string):Promise<void>;
    changePassword(userId:string, newPassword:string):Promise<void>;
}