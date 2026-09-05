import { NotificationSender } from "@modules/notifications/application/providers/NotificationSender.js";
import { Notification } from "@modules/notifications/domain/entities/Notification.js";


export class ConsoleNotificationSenderImpl implements NotificationSender{

    async send(notification: Notification): Promise<void> {
       console.log(`[EMAIL] to =${notification.recipientUserEmail} subject="${notification.subject}`, notification.message);
    }

} 