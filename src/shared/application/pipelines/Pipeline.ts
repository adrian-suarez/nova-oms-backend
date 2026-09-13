import { Context } from "aws-lambda";
import { PipelineBehavior } from "./PipelineBehavior.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";


export class Pipeline<TEvent, TResult>  implements Handler<TEvent, TResult>{
    constructor(private readonly handler:Handler<TEvent, TResult>,
        private readonly behaviors : PipelineBehavior<TEvent, TResult>[]){}
    descriptor: HandlerDescriptor = {};
    
    handle(event: TEvent, context: Context): Promise<TResult> {

        return this.dispatch(event, context,0);
    }    

    private async dispatch(event: TEvent, context: Context, index: number): Promise<TResult>{
        if(index>= this.behaviors.length){
            return this.handler.handle(event,context);
        }
        const behavior = this.behaviors[index];

        return behavior!.handle(this.handler.descriptor,event,context, ()=> this.dispatch(event,context, index+1));
    }
}