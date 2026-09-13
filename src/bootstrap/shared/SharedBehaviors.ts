import { SharedContainer } from "./SharedContainer.js";
import { AuthorizationBehavior } from "@shared/application/pipelines/behaviors/AuthorizationBehavior.js";
import { TransactionBehavior } from "@shared/application/pipelines/behaviors/TransactionBehavior.js";
import { RequestValidationBehavior } from "@shared/application/pipelines/behaviors/RequestValidationBehavior.js";
import { LoggingBehavior } from "@shared/application/pipelines/behaviors/LoggingBehavior.js";
import { IdempotencyBehavior } from "@shared/application/pipelines/behaviors/IdempotencyBehavior.js";
import { SharedInfrastructure } from "./SharedInfrastructure.js";



export class SharedBehaviors {
    readonly validationBehavior;
    readonly authorizationBehavior;
    readonly transactionBehavior;
    readonly loggingBehavior;
    readonly idempotencyBehavior;
    //readonly auditBehavior;
    
    constructor(container:SharedContainer, sharedInfrastructure:SharedInfrastructure){
        this.validationBehavior = new RequestValidationBehavior(container.executionContextProvider);
        this.authorizationBehavior = new AuthorizationBehavior(container.executionContextProvider);
        this.transactionBehavior =new TransactionBehavior(container.unitOfWork);
        this.loggingBehavior = new LoggingBehavior(container.logger);
        this.idempotencyBehavior = new IdempotencyBehavior(sharedInfrastructure.idempotencyRepository);
    }
}