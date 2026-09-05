import { Construct } from "constructs";
import { LambdaNetworkConfig, NodeLambdaFactory } from "../../base/lambda/NodeLambdaFactory.js";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ConfigConstruct } from "../../base/config/ConfigConstruct.js";
import { EventConstruct } from "../../base/event/EventConstruct.js";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SesConstruct } from "../../base/ses/SesConstruct.js";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

export class NotificationsConstruct extends Construct {
    public readonly notificationQueueConsumerLambdaFunction :NodejsFunction;
    public notificationQueue:sqs.Queue;;
    public dlqAlarm: cloudwatch.Alarm;

    constructor(scope: Construct, id:string,
        configConstruct:ConfigConstruct,
        eventBusConstruct:EventConstruct,
        sesConstruct:SesConstruct,
        lambdaNetworkConfig:LambdaNetworkConfig
    ){
        super(scope,id);

        //Consumer Lambda Function
        this.notificationQueueConsumerLambdaFunction = NodeLambdaFactory.create(this,"NotificationQueueConsumerLambda",{
            entry:"src/lambdas/notifications/queue.ts",
            environment: {...configConstruct.getLambdaEnv(), ...sesConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        //Queue
        const {queue,dlqAlarm} = eventBusConstruct.addQueueConsumer(this,"Notifications",this.notificationQueueConsumerLambdaFunction);
        configConstruct.grantReadConfig(this.notificationQueueConsumerLambdaFunction);
        this.notificationQueue = queue;
        this.dlqAlarm = dlqAlarm;

        sesConstruct.grantReadConfig(this.notificationQueueConsumerLambdaFunction);
        sesConstruct.grantSendEmail(this.notificationQueueConsumerLambdaFunction);

    }

}