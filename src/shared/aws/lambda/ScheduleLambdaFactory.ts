
import { ScheduleHandler } from "./Handler.js";
import { PipelineBehaviorRegistry } from "@shared/application/pipelines/PipelineBehaviorRegistry.js";
import { Logger } from "@shared/logger/Logger.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { ScheduleLambdaHandler } from "./ScheduleLambdaHandler.js";

export class ScheduleLambdaFactory{
    constructor(private readonly executionContextProvider:ExecutionContextProvider,
        private readonly behaviorRegistry: PipelineBehaviorRegistry,
        private readonly logger:Logger){}
    create(handler:ScheduleHandler){
        return ScheduleLambdaHandler.create(handler,this.behaviorRegistry,this.executionContextProvider, this.logger);
    }
}