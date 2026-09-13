import { NotificationRepository } from "@modules/notifications/domain/repositories/NotificationRepository.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { NotificationSender } from "../providers/NotificationSender.js";
import { NotificationRequest } from "../dto/request/NotificationRequest.js";
import { Notification, NotificationChannel, NotificationStatus } from "@modules/notifications/domain/entities/Notification.js";
import { NotificationTemplateFactory } from "./NotificationTemplateFactory.js";


export class CreateNotificationUseCase implements UseCase<NotificationRequest,void>{
    constructor(private readonly repository:NotificationRepository,
        private readonly sender:NotificationSender,
        private readonly templates: NotificationTemplateFactory
    ){}

    async execute(request: NotificationRequest): Promise<void> {
        if(await this.repository.existsById(request.id))return;

        const {subject, message} = this.templates.build(request.type,request.templateData);

        const notification = new Notification(
            request.id,
            request.type,
            NotificationChannel.EMAIL,
            request.recipientUserId,
            request.recipientUserEmail,
            subject,
            message,
            NotificationStatus.PENDING,
            new Date(),
            null,
            null
        );
        await this.repository.create(notification);

        try{
            await this.sender.send(notification);
            notification.markSent(new Date());
            await this.repository.update(notification);

        }catch(error){
            notification.markFailed(String(error));
            await this.repository.update(notification);

        }

    }
    

}