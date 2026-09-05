import { NotificationSender } from "@modules/notifications/application/providers/NotificationSender.js";
import { Notification } from "@modules/notifications/domain/entities/Notification.js";

import {SESClient, SendEmailCommand} from "@aws-sdk/client-ses";
import { IPolicy } from "cockatiel";

export class SesNotificationSenderImpl implements NotificationSender{

    constructor(private readonly client: SESClient,
        private readonly sesEmailAddress:string,
        private readonly policy: IPolicy
    ){
    }

    async send(notification: Notification): Promise<void> {
         await this.policy.execute(()=>  this.client.send(new SendEmailCommand({
            Source: this.sesEmailAddress,
            Destination: {ToAddresses:[notification.recipientUserEmail]},
            Message: {
                Subject: {  Data: notification.subject  },
                Body: { Text: { Data: notification.message  }   }
            }
        })));
    }

} 