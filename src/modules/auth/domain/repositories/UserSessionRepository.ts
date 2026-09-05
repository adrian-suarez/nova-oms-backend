import { UserSession } from "../entities/UserSession.js";


export interface UserSessionRepository{

    save(session:UserSession):Promise<void>;
    update(session:UserSession):Promise<void>;
    findById(id:string):Promise<UserSession|null>;
    revoke(id:string): Promise<void>;
    revokeAll(userId:string):Promise<void>;

}