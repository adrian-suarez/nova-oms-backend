import { LambdaFactory } from "@shared/aws/lambda/LambdaFactory.js";
import { PipelineBehaviorRegistry } from "@shared/application/pipelines/PipelineBehaviorRegistry.js";
import { ApplicationServices } from "./application/ApplicationServices.js";
import { SqsLambdaFactory } from "@shared/aws/lambda/SqsLambdaFactory.js";
import { createAuthBehavior } from "./security/SecurityFactory.js";
import { SharedBehaviors } from "./shared/SharedBehaviors.js";
import { SharedContainer } from "./shared/SharedContainer.js";
import { SharedInfrastructure } from "./shared/SharedInfrastructure.js";
import { ScheduleLambdaFactory } from "@shared/aws/lambda/ScheduleLambdaFactory.js";


export const sharedContainer = new SharedContainer();
export const sharedInfrastructure = new SharedInfrastructure(sharedContainer);
export const applicationServices = new ApplicationServices(sharedContainer,sharedInfrastructure);

const authBehavior = createAuthBehavior(sharedContainer,sharedInfrastructure,applicationServices);
const sharedBehaviors = new SharedBehaviors(sharedContainer,sharedInfrastructure);

const behaviorRegistry = new PipelineBehaviorRegistry(authBehavior,
    sharedBehaviors.authorizationBehavior,
    sharedBehaviors.transactionBehavior,
    sharedBehaviors.validationBehavior,
    sharedBehaviors.loggingBehavior,
    sharedBehaviors.idempotencyBehavior
);

export const lambdaFactory = new LambdaFactory(sharedContainer.executionContextProvider,
    behaviorRegistry,
    sharedContainer.logger,
    sharedContainer.metrics
);


export const sqsLambdaFactory = new SqsLambdaFactory(sharedContainer.executionContextProvider,
    behaviorRegistry,
    sharedContainer.logger,
    sharedContainer.metrics
);


export const scheduleLambdaFactory = new ScheduleLambdaFactory(sharedContainer.executionContextProvider,
    behaviorRegistry,
    sharedContainer.logger);