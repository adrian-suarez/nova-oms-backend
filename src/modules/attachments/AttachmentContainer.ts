import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";
import { StorageSharedContainer } from "@bootstrap/storage/StorageSharedContainer.js";
import { HttpHandler, SqsHandler } from "@shared/aws/lambda/Handler.js";
import { AttachmentFactory } from "./application/factories/AttachmentFactory.js";
import { GenerateUploadUrlUseCase } from "./application/use-cases/GenerateUploadUrlUseCase.js";
import { PrismaAttachmentRepositoryImpl } from "./infrastructure/repositories/PrismaAttachmentRepositoryImpl.js";
import { GenerateUploadUrlHandler } from "./presentation/handlers/GenerateUploadUrlHandler.js";
import { GenerateDownloadUrlHandler } from "./presentation/handlers/GenerateDownloadUrlHandler.js";
import { GenerateDownloadUrlUseCase } from "./application/use-cases/GenerateDownloadUrlUseCase.js";
import { GetAttachmentUseCase } from "./application/use-cases/GetAttachmentUseCase.js";
import { GetAttachmentHandler } from "./presentation/handlers/GetAttachmentHandler.js";
import { GetAttachmentsUseCase } from "./application/use-cases/GetAttachmentsUseCase.js";
import { GetAttachmentsHandler } from "./presentation/handlers/GetAttachmentsHandler.js";
import { DeleteAttachmentUseCase } from "./application/use-cases/DeleteAttachmentUseCase.js";
import { DeleteAttachmentHandler } from "./presentation/handlers/DeleteAttachmentHandler.js";
import { UploadQueueConsumerHandler } from "./presentation/consumers/UploadQueueConsumerHandler.js";
import { ConfirmUploadUseCase } from "./application/use-cases/ConfirmUploadUseCase.js";
import { EventSharedContainer } from "@bootstrap/events/EventSharedContainer.js";


export class AttachmentContainer{
    private readonly generateUploadUrlHandler:HttpHandler;
    private readonly generateDownloadUrlHandler:HttpHandler;

    private readonly getAttachmentHandler:HttpHandler;
    private readonly getAttachmentsHandler:HttpHandler;
    private readonly deleteAttachmentHandler:HttpHandler;
    private readonly uploadQueueConsumerHandler:SqsHandler;
    
    constructor(container: SharedContainer,
        storageSharedContainer:StorageSharedContainer,
        eventSharedContainer:EventSharedContainer){

        const repository = new PrismaAttachmentRepositoryImpl(container.prismaProvider);
        
        const attachmentFactory = new AttachmentFactory(storageSharedContainer.storageConfig,
            storageSharedContainer.storageKeyGenerator);
        const generateUploadUrlUseCase = new GenerateUploadUrlUseCase(repository,
            storageSharedContainer.storageProvider,
            storageSharedContainer.storagePolicy,
            attachmentFactory,
            storageSharedContainer.storageConfig
        );
        const generateDownloadUrlUseCase = new GenerateDownloadUrlUseCase(repository,
            storageSharedContainer.storageProvider,
            storageSharedContainer.storageConfig
        );
    
        const getAttachmentUseCase = new GetAttachmentUseCase(repository);

        const getAttachmentsUseCase = new GetAttachmentsUseCase(repository);

        const deleteAttachmentUseCase = new DeleteAttachmentUseCase(repository,
            storageSharedContainer.storageProvider,
            eventSharedContainer.domainEventDispatcher
        );


        const confirmUploadUseCase = new ConfirmUploadUseCase(repository,
            storageSharedContainer.storageProvider,
            storageSharedContainer.storageConfig,
            eventSharedContainer.domainEventDispatcher,
            container.logger
        );

        this.generateUploadUrlHandler = new GenerateUploadUrlHandler(generateUploadUrlUseCase,container.executionContextProvider);
        this.generateDownloadUrlHandler = new GenerateDownloadUrlHandler(generateDownloadUrlUseCase,container.executionContextProvider);
        this.getAttachmentHandler = new GetAttachmentHandler(getAttachmentUseCase,container.executionContextProvider);
        this.getAttachmentsHandler = new GetAttachmentsHandler(getAttachmentsUseCase,container.executionContextProvider);
        this.deleteAttachmentHandler = new DeleteAttachmentHandler(deleteAttachmentUseCase,container.executionContextProvider);
        this.uploadQueueConsumerHandler = new UploadQueueConsumerHandler(confirmUploadUseCase, container.logger);
        
    }

    getGenerateUploadUrlHandler():HttpHandler{
        return this.generateUploadUrlHandler;
    } 

    getGenerateDownloadUrlHandler():HttpHandler{
        return this.generateDownloadUrlHandler;
    } 

    getGetAttachmentHandler():HttpHandler{
        return this.getAttachmentHandler;
    } 

    getGetAttachmentsHandler():HttpHandler{
        return this.getAttachmentsHandler;
    } 

    getDeleteAttachmentHandler():HttpHandler{
        return this.deleteAttachmentHandler;
    } 


    getUploadQueueConsumerHandler(){
        return this.uploadQueueConsumerHandler;
    } 
}