import { LambdaHandlerFn } from "@shared/types/LambdaHandlerFn.js";

export type Middleware = (next: LambdaHandlerFn)=> LambdaHandlerFn;

export function compose(handler:LambdaHandlerFn,...middlewares:Middleware[]){
    return middlewares.reduce((next,middleware)=> middleware(next), handler);
}