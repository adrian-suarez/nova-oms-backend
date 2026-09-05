import { AuthenticatedUser, UserIdentity } from "../entities/AuthUser.js";

export interface IdentityRepository{
    load(user:UserIdentity):Promise<AuthenticatedUser>;

}