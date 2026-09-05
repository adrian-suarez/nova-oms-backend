import { compose,Middleware } from "@shared/middleware/middleware.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { HttpHandler } from "./Handler.js";
import { Pipeline } from "@shared/application/pipelines/Pipeline.js";
import { PipelineBehaviorRegistry } from "@shared/application/pipelines/PipelineBehaviorRegistry.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { createHttpExecutionContext } from "@shared/application/context/createHttpExecutionContext.js";
import { PipelineBehavior } from "@shared/application/pipelines/PipelineBehavior.js";

export class LambdaHandler{
    static create(handler:HttpHandler,
        behaviorRegistry: PipelineBehaviorRegistry,
        executionContextProvider:ExecutionContextProvider,
        ...middlewares: Middleware[]){
        return async(event:APIGatewayProxyEventV2, context:Context): Promise<APIGatewayProxyStructuredResultV2>=>{
            const executionContext = createHttpExecutionContext(event, handler.constructor.name);          
        
            return executionContextProvider.run(executionContext, async() =>{
            
                const behaviors = behaviorRegistry.resolve(handler.descriptor) as PipelineBehavior<APIGatewayProxyEventV2,APIGatewayProxyStructuredResultV2>[];
                const pipeline = new Pipeline<APIGatewayProxyEventV2,APIGatewayProxyStructuredResultV2>(handler,behaviors);
                const middleware = compose(pipeline.handle.bind(pipeline),...middlewares);

                return middleware(event,context)
            });
        };
    }
}