import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ExecutionContext } from "./ExecutionContext.js";
import { randomUUID } from "node:crypto";


export function createHttpExecutionContext(event:APIGatewayProxyEventV2, handlerName:string): ExecutionContext{

    const requestId= event.requestContext.requestId?? randomUUID();
    const correlationId= event.headers["nova-correlation-id"] ?? randomUUID();

    return new ExecutionContext(
        event,
        requestId,
        correlationId,
        handlerName
    );
}
