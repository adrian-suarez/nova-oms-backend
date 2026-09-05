import { NotificationType } from "@modules/notifications/domain/entities/Notification.js";


export interface NotificationRequest {
    id:string,
    type: NotificationType,
    recipientUserId:string,
    recipientUserEmail:string,
    templateData: Record<string, unknown>
}