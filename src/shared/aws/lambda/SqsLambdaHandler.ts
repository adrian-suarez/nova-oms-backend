import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";
import { SqsHandler } from "./Handler.js";
import { Pipeline } from "@shared/application/pipelines/Pipeline.js";
import { PipelineBehaviorRegistry } from "@shared/application/pipelines/PipelineBehaviorRegistry.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { createSqsExecutionContext } from "@shared/application/context/createSqsExecutionContext.js";
import { Logger } from "@shared/logger/Logger.js";
import { normalizeSqsMessage } from "./messages/MessageMapper.js";
import { Metrics } from "@aws-lambda-powertools/metrics";

export class SqsLambdaHandler{
    static create(handler:SqsHandler,
        behaviorRegistry: PipelineBehaviorRegistry,
        executionContextProvider:ExecutionContextProvider,
        logger:Logger,
        metrics: Metrics
    ){
        return async(event:SQSEvent, context:Context): Promise<SQSBatchResponse>=>{

            const batchItemFailures : { itemIdentifier:string }[] = [];
            
            for(const record of event.Records){
                const executionContext = createSqsExecutionContext(record, handler.constructor.name);          

                try{
                    await executionContextProvider.run(executionContext, async() =>{
                        logger.info("Event",{event});

                        const behaviors = behaviorRegistry.resolve(handler.descriptor);
                        const pipeline = new Pipeline(handler,behaviors);

                         const message = normalizeSqsMessage(record);

                        return pipeline.handle(message,context)
                    });
                }catch(error){
                    logger.error("SQS record processing failed", {error, messageId:record.messageId});
                    batchItemFailures.push({itemIdentifier:record.messageId});
                }
            }

            metrics.publishStoredMetrics();
            return {batchItemFailures};
        };
    }
}