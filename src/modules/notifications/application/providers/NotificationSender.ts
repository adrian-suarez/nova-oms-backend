import { Notification } from "@modules/notifications/domain/entities/Notification.js";


export interface NotificationSender{
    send(notification:Notification):Promise<void>;
}