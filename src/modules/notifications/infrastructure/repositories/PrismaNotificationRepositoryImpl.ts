import { Notification } from "@modules/notifications/domain/entities/Notification.js";
import { NotificationRepository } from "@modules/notifications/domain/repositories/NotificationRepository.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";


export class PrismaNotificationRepositoryImpl implements NotificationRepository {

    constructor(private readonly provider: PrismaProvider){}
  
    async create(notification: Notification): Promise<void> {
        await this.provider.getClient().notification.create({data:{
            id: notification.id,
            type: notification.type,
            channel: notification.channel,
            recipientUserId: notification.recipientUserId,
            recipientUserEmail: notification.recipientUserEmail,
            subject: notification.subject,
            message: notification.message,
            status: notification.status,
            createdAt: notification.createdAt,
            sentAt: notification.sentAt,
            lastError: notification.lastError,
        }});
    }

    async update(notification: Notification): Promise<void> {
       await this.provider.getClient().notification.update({
        where:{
                id: notification.id
        },
        data:{
            status: notification.status,
            sentAt: notification.sentAt,
            lastError: notification.lastError,
        }});
    }

    async existsById(id: string): Promise<boolean> {
        return await this.provider.getClient().notification.findFirst({
            where:{
                id
            },
            select:{id:true}
        }) !=null;
    }

}