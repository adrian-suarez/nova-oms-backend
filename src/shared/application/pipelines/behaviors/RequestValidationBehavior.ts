import { PipelineBehavior, PipelineNext } from "../PipelineBehavior.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";


export class RequestValidationBehavior implements PipelineBehavior<APIGatewayProxyEventV2,
        APIGatewayProxyStructuredResultV2>{
    
    constructor(private readonly executionContextProvider: ExecutionContextProvider){}
    
    handle(descriptor: HandlerDescriptor,event: APIGatewayProxyEventV2, context: Context, next: PipelineNext<APIGatewayProxyStructuredResultV2>): Promise<APIGatewayProxyStructuredResultV2> {
        const schema = descriptor.request;

        if(!schema){
            return next();
        }

        const rawRequest = {
            ...(event.pathParameters),
            ...(event.queryStringParameters),
            ...(JSON.parse(event.body && event.body.length >0 ? event.body  : "{}"))

        }

        this.executionContextProvider.get()?.setRequest( schema.parse(rawRequest));
        
        return next();
    }
    
}