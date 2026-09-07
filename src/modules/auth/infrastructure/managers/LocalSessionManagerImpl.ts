import { AuthenticationResponse, UserIdentity } from "@modules/auth/domain/entities/AuthUser.js";
import { SessionManager } from "./SessionManager.js";
import { UserSessionRepository } from "@modules/auth/domain/repositories/UserSessionRepository.js";
import { JwtService } from "@shared/security/jwt/JwtService.js";
import { UserSession } from "@modules/auth/domain/entities/UserSession.js";
import { RefreshTokenService } from "@shared/security/refresh/RefreshTokenService.js";
import { UserRepository } from "@modules/users/domain/repositories/UserRepository.js";
import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";
import { JwtClaims } from "@shared/security/jwt/JwtClaims.js";
import { UserMapper } from "@modules/users/application/mappers/UserMapper.js";


export class LocalSessionManagerImpl implements SessionManager{

    constructor(private readonly userSessionRepository: UserSessionRepository,
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly accessTokenExpires: number= 3600,
        private readonly refreshTokenDays: number= 30
    ){}
   
    async create(user: UserIdentity): Promise<AuthenticationResponse> {
        const accessToken = await this.jwtService.generate({sub: user.sub, email:user.email!});
        const refreshSecret = await this.refreshTokenService.generate();
        const refreshHash = await this.refreshTokenService.hash(refreshSecret);
        const sessionId = crypto.randomUUID();

        const refreshToken = `${sessionId}.${refreshSecret}`;

        const userSession = new UserSession(sessionId,user.sub,refreshHash,null,null,this.addDays(this.refreshTokenDays), new Date(), null);
        await this.userSessionRepository.save(userSession);

        return {
            accessToken, refreshToken, expiresIn:this.accessTokenExpires
        }
    }

    async authenticate(accessToken: string): Promise<UserIdentity> {
        const claims = await this.jwtService.verify(accessToken);
        const user = await this.userRepository.findByEmailWithRole(claims.email);

        if(!user){
            throw new UnauthorizedError("User not found");
        }

        if(!user.enabled){
            throw new UnauthorizedError("User disabled");
        }

        return UserMapper.toAuthUserEntity(user);
    }
    async refresh(refreshToken: string): Promise<AuthenticationResponse> {
        const [sessionId, refreshSecret] = refreshToken.split(".");

        if(!sessionId || !refreshSecret){
            throw new UnauthorizedError("Invalid refresh session");
        }

        const session = await this.userSessionRepository.findById(sessionId);

        if(!session){
            throw new UnauthorizedError("Session not found");
        }

        if(session.revoked){
            throw new UnauthorizedError("Session revoked");
        }
        if(session.expiresAt < new Date()){
            throw new UnauthorizedError("Session expired");
        }

        const valid = await this.refreshTokenService.verify(refreshSecret,session.refreshTokenHash);
        if(!valid){
            await this.userSessionRepository.revokeAll(session.userId);
            throw new UnauthorizedError("Refresh token reuse detected");
        }

        const user = await this.userRepository.findByIdWithRoles(session.userId);
        if(!user){
            throw new UnauthorizedError("User not found");
        }
        const claims: JwtClaims=UserMapper.toJwtClaims(user);

        const accessToken = await this.jwtService.generate(claims);
        const newRefreshSecret = await this.refreshTokenService.generate();
        const refreshHash = await this.refreshTokenService.hash(newRefreshSecret);

        const newRefreshToken = `${sessionId}.${newRefreshSecret}`; 

        session.rotate(refreshHash, new Date());
        await this.userSessionRepository.update(session);

        return {
            accessToken, refreshToken:newRefreshToken, expiresIn:this.accessTokenExpires
        }


    }
    async revoke(refreshToken: string): Promise<void> {
        const [sessionId,refreshSecret] = refreshToken.split(".");


        if(!sessionId || !refreshSecret){
            throw new UnauthorizedError("Invalid refresh session");
        }

        await this.userSessionRepository.revoke(sessionId);
    }

    async revokeAll(userId: string): Promise<void> {
        await this.userSessionRepository.revokeAll(userId);

    }

    private addDays(days:number):Date{
        const date = new Date();
        date.setDate(date.getDate()+days);
        return date;
    }

}