import { AuthenticationResponse, UserIdentity } from "@modules/auth/domain/entities/AuthUser.js";


export interface SessionManager{
    create(authUser:UserIdentity):Promise<AuthenticationResponse>;
    authenticate(accessToken:string):Promise<UserIdentity>;
    refresh(refreshToken:string):Promise<AuthenticationResponse>;
    revoke(refreshToken:string):Promise<void>;
    revokeAll(userId:string):Promise<void>;
}