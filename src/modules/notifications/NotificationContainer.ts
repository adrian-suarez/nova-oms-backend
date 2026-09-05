
import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";
import { SqsHandler } from "@shared/aws/lambda/Handler.js";
import { NotificationQueueConsumerHandler } from "./presentation/consumer/NotificationQueueConsumerHandler.js";
import { NotificationTemplateFactory } from "./application/use-cases/NotificationTemplateFactory.js";
import { PrismaNotificationRepositoryImpl } from "./infrastructure/repositories/PrismaNotificationRepositoryImpl.js";
import { CreateNotificationUseCase } from "./application/use-cases/CreateNotificationUseCase.js";
import { SesContainer } from "@bootstrap/ses/SesContainer.js";
import { SesNotificationSenderImpl } from "./infrastructure/providers/SesNotificationSenderImpl.js";
import { ResiliencePolicyFactory } from "@shared/infrastructure/resilience/ResiliencePolicyFactory.js";


export class NotificationContainer {

    private readonly notificationQueueConsumerHandler:SqsHandler;

    constructor(container: SharedContainer, sesContainer:SesContainer){

        const repository = new PrismaNotificationRepositoryImpl(container.prismaProvider);
        const notificationFactory = new NotificationTemplateFactory();

        const policy = ResiliencePolicyFactory.create({
                        metricName:"ses",
                    },
                    container.metrics
                );
        const sesSender = new SesNotificationSenderImpl(sesContainer.sesClient, sesContainer.sesConfig.sesEmailAddress, policy);

        const createNotificationUseCase = new CreateNotificationUseCase(repository,
            sesSender,
            notificationFactory
        );
        //consumers
        this.notificationQueueConsumerHandler = new NotificationQueueConsumerHandler(createNotificationUseCase,container.logger);
    }

    getNotificationQueueConsumerHandler():SqsHandler{
        return this.notificationQueueConsumerHandler;
    }
}