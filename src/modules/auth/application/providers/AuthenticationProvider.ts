import { LoginRequest } from "@modules/auth/application/dto/request/LoginRequest.js";
import { AuthenticationResponse, UserIdentity } from "../../domain/entities/AuthUser.js";

export interface AuthenticationProvider {
    login(request:LoginRequest):Promise<AuthenticationResponse>;
    authenticate(accessToken: string):Promise<UserIdentity>;
    refresh(refreshToken:string):Promise<AuthenticationResponse>;
    logout(token:string):Promise<void>;
}