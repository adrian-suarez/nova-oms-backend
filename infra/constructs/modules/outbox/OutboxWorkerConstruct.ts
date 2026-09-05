import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import * as targets from "aws-cdk-lib/aws-scheduler-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaNetworkConfig, NodeLambdaFactory } from "../../base/lambda/NodeLambdaFactory.js";
import { ConfigConstruct } from "../../base/config/ConfigConstruct.js";
import { EventConstruct } from "../../base/event/EventConstruct.js";

export class OutboxWorkerConstruct extends Construct {
    public readonly outboxPublisherLambdaFunction: NodejsFunction;

    constructor(scope: Construct,
        id: string,
        configConstruct: ConfigConstruct,
        eventBusConstruct: EventConstruct,
        lambdaNetworkConfig:LambdaNetworkConfig
    ) {
        super(scope, id);

        this.outboxPublisherLambdaFunction = NodeLambdaFactory.create(this, "OutboxPublisherWorkerLambda", {
            entry: "src/lambdas/outbox-publisher/worker.ts",
            environment: { 
                ...configConstruct.getLambdaEnv(),
                ...eventBusConstruct.getLambdaEnv() 
            },
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.outboxPublisherLambdaFunction);
        eventBusConstruct.grantReadConfig(this.outboxPublisherLambdaFunction);
        eventBusConstruct.grantPutEvents(this.outboxPublisherLambdaFunction);

        new scheduler.Schedule(this, "ProcessOrdersSchedule", {
            schedule: scheduler.ScheduleExpression.rate(
                cdk.Duration.minutes(1)
            ),
            target: new targets.LambdaInvoke(this.outboxPublisherLambdaFunction,{
                retryAttempts: 3
            })
        });
    }
}
