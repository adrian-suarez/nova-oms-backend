
import { Handler } from "@shared/aws/lambda/Handler.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { EventBridgeEvent } from "@shared/aws/lambda/messages/MessageMapper.js";
import { Logger } from "@shared/logger/Logger.js";
import { Context } from "aws-lambda";

interface UserCreatedDetail {
    userId: string;
    email: string;
}

export class UserQueueConsumerHandler extends Handler{
    descriptor: HandlerDescriptor = {};

    constructor(private readonly logger: Logger) {
        super()
    }

    async handle(event: EventBridgeEvent<UserCreatedDetail>, _context: Context): Promise<void> {
        this.logger.info(`SQS User Queue Consumer: ${event.source}`, { detail: event.detail });
    }
}