import { Context } from "aws-lambda";
import { PipelineBehavior, PipelineNext } from "../PipelineBehavior.js";
import { Logger } from "@shared/logger/Logger.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";


export class LoggingBehavior<TEvent=unknown,TResult=unknown> implements PipelineBehavior<TEvent,TResult>{
    constructor(private readonly logger:Logger){}
    async handle(descriptor: HandlerDescriptor,event: TEvent, context: Context, next: PipelineNext<TResult>): Promise<TResult> {

        try{
            this.logger.info("handler execution started");
            const response = await next();

            this.logger.info("handler execution completed");
            return response;
        }catch(error: unknown){
            this.logger.error("Handler execution error",{error});
            throw error;
        }

      
    }
}