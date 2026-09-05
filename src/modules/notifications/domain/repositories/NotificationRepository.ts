import { Notification } from "../entities/Notification.js";


export interface NotificationRepository {
    create(notification:Notification): Promise<void>;
    update(notification:Notification): Promise<void>;
    existsById(id:string): Promise<boolean>;
}