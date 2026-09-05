import { PipelineBehavior, PipelineNext } from "../PipelineBehavior.js";
import { ForbiddenError } from "@shared/errors/ForbiddenError.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";

export class AuthorizationBehavior implements PipelineBehavior<APIGatewayProxyEventV2,
        APIGatewayProxyStructuredResultV2>{

    constructor(private readonly executionContextProvider: ExecutionContextProvider){}

    handle(descriptor: HandlerDescriptor, event: APIGatewayProxyEventV2, context: Context, next: PipelineNext<APIGatewayProxyStructuredResultV2>): Promise<APIGatewayProxyStructuredResultV2> {
        
        const permissions = descriptor.permissions;

        if(!permissions?.length){
            return next();
        }
        const user = this.executionContextProvider.get()?.getUser()!;

        const allowed = permissions.every( p => user.hasPermission(p));

        if(!allowed){
            throw new ForbiddenError();
        }

        return next();

    }
    
}