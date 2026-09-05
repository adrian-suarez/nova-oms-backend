import { OutboxPublisherWorker } from "@shared/application/workers/OutboxPublisherWorker.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { Logger } from "@shared/logger/Logger.js";
import { Context } from "aws-lambda";

export class OutboxWorkerHandler extends Handler{
  descriptor: HandlerDescriptor = {

  };

  constructor( private readonly  worker:OutboxPublisherWorker,private readonly logger:Logger ){
    super();
  }

  async handle(event:unknown, context: Context): Promise<void> {
    this.logger.info("OutboxWorkerHandler",{event, context});
    await this.worker.execute();
  }
}
