import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";
import { AuditEventHandler } from "@modules/audit/infrastructure/events/AuditEventHandler.js";
import { PrismaAuditRepositoryImpl } from "@modules/audit/infrastructure/repositories/PrismaAuditRepositoryImpl.js";
import { DomainEventDispatcher } from "@shared/application/orchestration/DomainEventDispatcher.js";
import { ExternalSyncOrchestrator } from "@shared/application/orchestration/ExternalSyncOrchestrator.js";
import { EventConfig } from "@shared/config/EventConfig.js";
import { PrismaOutboxRepositoryImpl } from "@shared/infrastructure/repositories/PrismaOutboxRepositoryImpl.js";
import { DefaultOutboxEventPublisherImpl } from "@shared/infrastructure/services/DefaultOutboxEventPublisherImpl.js";
import { EventBridgeEventPublisherImpl } from "@shared/infrastructure/services/EventBridgeEventPublisherImpl.js";
import * as AWSXRay from "aws-xray-sdk-core";


export class EventSharedContainer {

    readonly eventConfig;
    readonly eventClient;

    readonly domainEventDispatcher: DomainEventDispatcher
    readonly orchestrator: ExternalSyncOrchestrator;
    readonly outboxRepository: PrismaOutboxRepositoryImpl;
    readonly outboxPublisher: DefaultOutboxEventPublisherImpl;

    constructor(container: SharedContainer){
        this.eventConfig = new EventConfig();

        if(container.config.endpoint){

            this.eventClient = new EventBridgeClient({
                region: container.config.awsRegion,
                endpoint: container.config.endpoint
            });

        }else{
            this.eventClient = new EventBridgeClient({
                region: container.config.awsRegion
            });
        }
        AWSXRay.captureAWSv3Client(this.eventClient);

        this.outboxRepository = new PrismaOutboxRepositoryImpl(container.prismaProvider);
        const eventPublisher = new EventBridgeEventPublisherImpl(this.eventClient, this.eventConfig.eventBusName, container.logger);
        this.outboxPublisher = new DefaultOutboxEventPublisherImpl(this.outboxRepository, eventPublisher, container.logger);

        const auditRepository = new PrismaAuditRepositoryImpl(container.prismaProvider);
        const auditHandler = new AuditEventHandler(auditRepository);

        this.domainEventDispatcher = new DomainEventDispatcher(container.unitOfWork,
            this.outboxRepository,
            this.outboxPublisher,
            [auditHandler],
            container.executionContextProvider,
            container.logger
        );
        this.orchestrator = new ExternalSyncOrchestrator(this.domainEventDispatcher);

    }

}
