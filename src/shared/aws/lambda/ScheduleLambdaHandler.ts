import { Context } from "aws-lambda";
import { ScheduleHandler } from "./Handler.js";
import { PipelineBehaviorRegistry } from "@shared/application/pipelines/PipelineBehaviorRegistry.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { Logger } from "@shared/logger/Logger.js";
import { createScheduledExecutionContext } from "@shared/application/context/createScheduledExecutionContext.js";
import { Pipeline } from "@shared/application/pipelines/Pipeline.js";

export class ScheduleLambdaHandler{
    static create(handler:ScheduleHandler,
        behaviorRegistry: PipelineBehaviorRegistry,
        executionContextProvider:ExecutionContextProvider,
        logger:Logger){
        return async(event:unknown, context:Context): Promise<void>=>{                
            try {
                const scheduleContext = createScheduledExecutionContext("OutboxPublisherHandler");
                await executionContextProvider.run(scheduleContext, async () => {
                        const behaviors = behaviorRegistry.resolve(handler.descriptor);
                        const pipeline = new Pipeline(handler,behaviors);

                        return pipeline.handle(event,context);
                });

             } catch (error) {
                logger.error("Outbox publisher worker failed", { error });
            }
        };
    }
}