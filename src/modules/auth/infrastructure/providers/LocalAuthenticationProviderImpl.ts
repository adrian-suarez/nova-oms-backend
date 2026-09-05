import { AuthenticationResponse, UserIdentity } from "@modules/auth/domain/entities/AuthUser.js";
import { LoginRequest } from "@modules/auth/application/dto/request/LoginRequest.js";
import { AuthenticationProvider } from "../../application/providers/AuthenticationProvider.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { PasswordHasher } from "@shared/security/hash/PasswordHasher.js";
import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";
import { SessionManager } from "../managers/SessionManager.js";
import { UserMapper } from "@modules/users/application/mappers/UserMapper.js";
import { Logger } from "@shared/logger/Logger.js";

export class LocalAuthenticationProviderImpl implements AuthenticationProvider{
    constructor(private readonly userRepository:UserRepository,
        private readonly passwordHasher:PasswordHasher,
        private readonly sessionManager: SessionManager,
        private readonly logger:Logger
    ){}
   
    async login(request: LoginRequest): Promise<AuthenticationResponse> {
        const user = await this.userRepository.findByEmailWithRole(request.email);

        if(!user || !user.password){
            throw new UnauthorizedError("Invalid credentials");
        }
        const valid = await this.passwordHasher.verify(request.password, user.password!);

        if(!valid){
            throw new UnauthorizedError("Invalid credentials");
        }

        if(!user.enabled){
            throw new UnauthorizedError("User disabled");
        }

        const authUser:UserIdentity = UserMapper.toAuthUserEntity(user);
        
        return this.sessionManager.create(authUser);
    }
    async authenticate(accessToken: string): Promise<UserIdentity> {
        try{
            return await this.sessionManager.authenticate(accessToken);
        }catch(error: unknown){
            this.logger.error(error instanceof Error ? error.message : String(error));
            throw new UnauthorizedError("Invalid credentials");
        }
    }
    async refresh(refreshToken: string): Promise<AuthenticationResponse> {
        return this.sessionManager.refresh(refreshToken);
    }
    async logout(token: string): Promise<void> {
        await this.sessionManager.revoke(token);
    }
    
}