
import { SqsHandler } from "./Handler.js";
import { PipelineBehaviorRegistry } from "@shared/application/pipelines/PipelineBehaviorRegistry.js";
import { Logger } from "@shared/logger/Logger.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { SqsLambdaHandler } from "./SqsLambdaHandler.js";
import { Metrics } from "@aws-lambda-powertools/metrics";

export class SqsLambdaFactory{
    constructor(private readonly executionContextProvider:ExecutionContextProvider,
        private readonly behaviorRegistry: PipelineBehaviorRegistry,
        private readonly logger:Logger,
        private readonly metrics: Metrics
    ){}
    create(handler:SqsHandler){
        return SqsLambdaHandler.create(handler,this.behaviorRegistry,this.executionContextProvider, this.logger, this.metrics);
    }
}