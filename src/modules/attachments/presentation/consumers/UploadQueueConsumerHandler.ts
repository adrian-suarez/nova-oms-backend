import { ConfirmUploadUseCase } from "@modules/attachments/application/use-cases/ConfirmUploadUseCase.js";
import { Context } from "aws-lambda";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { isS3Event } from "@shared/aws/lambda/messages/EventGuard.js";
import { Logger } from "@shared/logger/Logger.js";


export class UploadQueueConsumerHandler extends Handler {
    descriptor: HandlerDescriptor = {};

    constructor(private readonly confirmUploadUseCase: ConfirmUploadUseCase,
        private readonly logger:Logger
    ){
        super();
    }
    async handle(event: unknown, _context: Context): Promise<void> {  
        
        if(!isS3Event(event)){
            this.logger.info("Ignoring message it's not an s3 event");
            return ;
        }

        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(
                record.s3.object.key.replace(/\+/g, " ")
            );
            this.logger.info(`Processing file: ${bucket}/${key}`);
            await this.confirmUploadUseCase.execute({bucket,key});
        }

    }

}