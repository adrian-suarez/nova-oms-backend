import { Prisma } from "@prisma/client";
import { UserSession } from "@modules/auth/domain/entities/UserSession.js";
import { UserSessionRepository } from "@modules/auth/domain/repositories/UserSessionRepository.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";


export class PrismaUserSessionRepositoryImpl implements UserSessionRepository{

    constructor(private readonly prisma:PrismaProvider){}
   
    private toUserSessionEntity(session:Prisma.UserSessionGetPayload<{}>) : UserSession{
        return new UserSession(
            session.id,
            session.userId,
            session.refreshTokenHash,
            session.device,
            session.ip,
            session.expiresAt,
            session.createdAt,
            session.revokedAt
        );
    }

    async save(session: UserSession): Promise<void> {

        await this.prisma.getClient().userSession.create({data:{
            id:session.id,
            userId:session.userId,
            refreshTokenHash: session.refreshTokenHash,
            expiresAt: session.expiresAt,
            revokedAt: session.revokedAt,
            device: session.device,
            ip: session.ip,
            createdAt:session.createdAt
        }})
        
    }

    async update(session: UserSession): Promise<void> {
        await this.prisma.getClient().userSession.update({
            where:{id:session.id},
            data:{
                refreshTokenHash: session.refreshTokenHash,
                expiresAt: session.expiresAt,
                revokedAt: session.revokedAt
            }
        })
    }
    async findById(id: string): Promise<UserSession | null> {
        const session = await this.prisma.getClient().userSession.findUnique({where:{id}});
        if(!session)
            return null;
        return this.toUserSessionEntity(session);
    }

    
    async revoke(id: string): Promise<void> {
        await this.prisma.getClient().userSession.update({
            where:{id:id},
            data:{
                revokedAt: new Date()
            }
        })
    }
    async revokeAll(userId: string): Promise<void> {
         await this.prisma.getClient().userSession.updateMany({
            where:{userId, revokedAt:null},
            data:{
                revokedAt: new Date()
            }
        })
    }
    
}