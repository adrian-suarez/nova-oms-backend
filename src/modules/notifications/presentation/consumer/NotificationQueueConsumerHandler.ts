
import { CreateNotificationUseCase } from "@modules/notifications/application/use-cases/CreateNotificationUseCase.js";
import { NotificationType } from "@modules/notifications/domain/entities/Notification.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { isEventBridgeEvent, isS3Event } from "@shared/aws/lambda/messages/EventGuard.js";
import { EventBridgeEvent } from "@shared/aws/lambda/messages/MessageMapper.js";
import { Logger } from "@shared/logger/Logger.js";
import { Context } from "aws-lambda";

type NotificationEvent = EventBridgeEvent<object> | object

export class NotificationQueueConsumerHandler extends Handler{
    descriptor: HandlerDescriptor = {};
   
    constructor(private readonly createNotificationUseCase:CreateNotificationUseCase, private readonly logger:Logger) {
        super()
    }

    async handle(event: NotificationEvent, _context: Context): Promise<void> {

        this.logger.info("SQS Notification Queue Consumer", {event});

        if(isS3Event(event)){
            for(const record of event.Records){
                this.logger.info("Notification for S3", {
                        id: `s3-${record.s3.object.key}`,
                        type: NotificationType.ATTACHMENT_PROCESSING,
                        recipientUserId:"",
                        recipientUserEmail:"",
                        templateData:{ key: record.s3.object.key}
                    }
                );
            }
            return;
        }

        if(isEventBridgeEvent(event)){
            switch(event["detail-type"]){
                case "user.created" :
                    return await this.createNotificationUseCase.execute({
                        id:event.id,
                        type: NotificationType.USER_WELCOME,
                        recipientUserId: (event.detail as {userId:string}).userId,
                        recipientUserEmail: (event.detail as {email:string}).email,
                        templateData: event.detail as Record<string,unknown>
                    });
                case "user.updated" :
                    return await this.createNotificationUseCase.execute({
                        id:event.id,
                        type: NotificationType.USER_UPDATED,
                        recipientUserId: (event.detail as {userId:string}).userId,
                        recipientUserEmail: (event.detail as {email:string}).email,
                        templateData: event.detail as Record<string,unknown>
                    });
                case "user.deleted" :
                    return await this.createNotificationUseCase.execute({
                        id:event.id,
                        type: NotificationType.USER_DISABLED,
                        recipientUserId: (event.detail as {userId:string}).userId,
                        recipientUserEmail: (event.detail as {email:string}).email,
                        templateData: event.detail as Record<string,unknown>
                    });
                case "attachment.uploaded":
                    return await this.createNotificationUseCase.execute({
                        id:event.id,
                        type: NotificationType.ATTACHMENT_UPLOADED,
                        recipientUserId: (event.detail as {ownerUserId:string}).ownerUserId,
                        recipientUserEmail: (event.detail as {ownerUserEmail:string}).ownerUserEmail,
                        templateData: event.detail as Record<string,unknown>
                    });
                case "attachment.failed":
                    return await this.createNotificationUseCase.execute({
                        id:event.id,
                        type: NotificationType.ATTACHMENT_FAILED,
                        recipientUserId: (event.detail as {ownerUserId:string}).ownerUserId,
                        recipientUserEmail: (event.detail as {ownerUserEmail:string}).ownerUserEmail,
                        templateData: event.detail as Record<string,unknown>
                    });
                case "attachment.deleted" :
                    return await this.createNotificationUseCase.execute({
                        id:event.id,
                        type: NotificationType.ATTACHMENT_DELETED,
                        recipientUserId: (event.detail as {ownerUserId:string}).ownerUserId,
                        recipientUserEmail: (event.detail as {ownerUserEmail:string}).ownerUserEmail,
                        templateData: event.detail as Record<string,unknown>
                    });
            }
            return;
        }

    }
}