import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { PipelineBehavior, PipelineNext } from "../PipelineBehavior.js";
import { UnitOfWork } from "@shared/database/UnitOfWork.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";


export class TransactionBehavior implements  PipelineBehavior<APIGatewayProxyEventV2,
        APIGatewayProxyStructuredResultV2>{
    constructor(private readonly uow:UnitOfWork){}

    handle(descriptor: HandlerDescriptor, event: APIGatewayProxyEventV2, context: Context, next: PipelineNext<APIGatewayProxyStructuredResultV2>): Promise<APIGatewayProxyStructuredResultV2> {
        return this.uow.execute(next);
    }
    
}