import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { Context } from "aws-lambda";

export type PipelineNext<TResult> = ()=>Promise<TResult>;

export interface PipelineBehavior<TEvent = unknown, TResult = unknown> {
    handle( descriptor: HandlerDescriptor,event: TEvent, context: Context, next:PipelineNext<TResult>): Promise<TResult>;
}