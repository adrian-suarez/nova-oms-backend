import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { PipelineBehavior } from "./PipelineBehavior.js";
import { AuthenticationBehavior } from "./behaviors/AuthenticationBehavior.js";
import { AuthorizationBehavior } from "./behaviors/AuthorizationBehavior.js";
import { TransactionBehavior } from "./behaviors/TransactionBehavior.js";
import { RequestValidationBehavior } from "./behaviors/RequestValidationBehavior.js";
import { LoggingBehavior } from "./behaviors/LoggingBehavior.js";
import { IdempotencyBehavior } from "./behaviors/IdempotencyBehavior.js";


export class PipelineBehaviorRegistry {
    constructor(readonly authenticationBehavior:AuthenticationBehavior,
        readonly authorizationBehavior:AuthorizationBehavior,
        readonly transactionBehavior:TransactionBehavior,
        readonly validationBehavior:RequestValidationBehavior,
        readonly loggingBehavior: LoggingBehavior,
        readonly idempotencyBehavior:IdempotencyBehavior
        ){}

    resolve(descriptor: HandlerDescriptor): PipelineBehavior[]{
        const behaviors : PipelineBehavior[] = [];
        behaviors.push(this.loggingBehavior);
        if(descriptor.authenticated){
            behaviors.push(this.authenticationBehavior)

            if(descriptor.permissions){
                behaviors.push(this.authorizationBehavior)
            }
        }
        if(descriptor.request){
            behaviors.push(this.validationBehavior)
        }

        if(descriptor.idempotent){
            behaviors.push(this.idempotencyBehavior)
        }

        if(descriptor.transaction){
            behaviors.push(this.transactionBehavior)
        }
        
      return behaviors;

    }
}