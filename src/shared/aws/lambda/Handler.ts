import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context, S3Event, SQSRecord } from "aws-lambda";
import { HandlerDescriptor } from "./HandlerDescriptor.js";
import { EventBridgeEvent } from "./messages/MessageMapper.js";


export abstract class Handler<TEvent = unknown, TResult =  unknown> {

    abstract readonly descriptor: HandlerDescriptor;
    
    abstract handle (event: TEvent,context: Context) : Promise<TResult>;

}


export type HttpHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>;
export type SqsHandler = Handler<SQSRecord, void> | Handler<S3Event, void> | Handler<EventBridgeEvent, void>;
export type ScheduleHandler = Handler<unknown, void>;