
import { HttpHandler } from "./Handler.js";
import { PipelineBehaviorRegistry } from "@shared/application/pipelines/PipelineBehaviorRegistry.js";
import { Logger } from "@shared/logger/Logger.js";
import { LambdaHandler } from "./LambdaHandler.js";
import { exceptionMiddleware } from "@shared/middleware/exceptionMiddleware.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { Metrics } from "@aws-lambda-powertools/metrics";

export class LambdaFactory{
    constructor(private readonly executionContextProvider:ExecutionContextProvider,
        private readonly behaviorRegistry: PipelineBehaviorRegistry,
        private readonly logger:Logger,
        private readonly metrics:Metrics
    ){}
    create(handler:HttpHandler){
        return LambdaHandler.create(handler,this.behaviorRegistry,this.executionContextProvider, exceptionMiddleware(this.logger, this.metrics));
    }
}