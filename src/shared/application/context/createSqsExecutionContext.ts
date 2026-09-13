import { SQSRecord } from "aws-lambda";
import { ExecutionContext } from "./ExecutionContext.js";
import { randomUUID } from "node:crypto";


export function createSqsExecutionContext(record:SQSRecord, handlerName:string): ExecutionContext{

    const correlationId= record.messageAttributes?.["nova-correlation-id"]?.stringValue ?? randomUUID();

    return new ExecutionContext(
        record,
        record.messageId,
        correlationId,
        handlerName
    );
}
