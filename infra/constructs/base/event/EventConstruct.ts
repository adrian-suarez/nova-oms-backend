import { Construct } from "constructs";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as cdk from "aws-cdk-lib";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class EventConstruct extends Construct{

    readonly eventBus: events.EventBus;
    readonly eventBusNameParameter: ssm.StringParameter;
    readonly config;
    readonly environment;
    constructor(scope: Construct, id: string){
        super(scope,id);
        const env = this.node.tryGetContext("env") ?? "dev";
        this.config = scope.node.tryGetContext(env);

        this.eventBus = new events.EventBus(this, "NovaOMSEventBus",{
            eventBusName:`novaoms-${env}-bus`,
        })
        this.eventBusNameParameter = new ssm.StringParameter(this, "EventBusNameParameter", {
            parameterName: `/novaoms/${env}/event_bridge/bus_name`,
            stringValue: this.eventBus.eventBusName,
        });

        this.environment = {
            AWS_EVENT_BUS_NAME:this.eventBusNameParameter.stringValue
        }

        new cdk.CfnOutput(this, "EventBusName", {
            value: this.eventBus.eventBusName,
        });

    }

    grantReadConfig(lambdaFunction: NodejsFunction){
        this.eventBusNameParameter.grantRead(lambdaFunction);
    }

    grantPutEvents(lambdaFunction: NodejsFunction){
        this.eventBus.grantPutEventsTo(lambdaFunction);
    }

    addQueueConsumer( scope: Construct, id:string,lambdaFunction: NodejsFunction,visibilityTimeout?:number){
        const env = this.node.tryGetContext("env") ?? "dev";

        const dlq = new sqs.Queue(scope,`${id}Dlq`,{
            queueName: `novaoms-${env}-${id.toLowerCase()}-dlq`,
            retentionPeriod: cdk.Duration.days(14)
        });

        const dlqAlarm = new cloudwatch.Alarm(scope, `${id}DlqAlarm`,{
            metric: dlq.metricApproximateNumberOfMessagesVisible({period: cdk.Duration.minutes(5)}),
            threshold:1,
            evaluationPeriods:1,
            alarmDescription: `Message in DLQ of ${id} - something is systematically failing`
        });

        const queue = new sqs.Queue(scope,`${id}Queue`,{
            queueName: `novaoms-${env}-${id.toLowerCase()}-queue`,
            visibilityTimeout: cdk.Duration.seconds(visibilityTimeout ?? 60),
            deadLetterQueue:{
                queue:dlq,
                maxReceiveCount: 3
            }
        });

        queue.grantConsumeMessages(lambdaFunction);
        lambdaFunction.addEventSource(new SqsEventSource(queue,{
            batchSize:1,
            reportBatchItemFailures: true,
            maxConcurrency: 20,
        }));
       
        new cdk.CfnOutput(scope, `${id}QueueUrl`, {
            value: queue.queueUrl,
        });

        return {queue, dlq, dlqAlarm};
    }

    addEventRule( id:string, pattern: events.EventPattern, queues : sqs.Queue [] ){

        new events.Rule(this,id,{
            eventBus:this.eventBus,
            eventPattern: pattern,
            targets:queues.map(queue => new targets.SqsQueue(queue))
        });
        
    }

    addTopic(id:string, queues : sqs.Queue [] ){
        const topicName = `${id}Topic`;
        const topic = new sns.Topic(this, topicName,{
            topicName: topicName
        });

        for(const queue of queues){
            topic.addSubscription(new subscriptions.SqsSubscription(queue));
        }

        return topic;
    }


    addAlarmTopic(id:string, alarms: cloudwatch.Alarm [] ){
        const topicName = `${id}Topic`;
        const topic = new sns.Topic(this, topicName,{
            topicName: topicName
        });

        topic.addSubscription(new subscriptions.EmailSubscription(this.config.SES_EMAIL_ADDRESS));
        for(const alarm of alarms){
            alarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(topic));
        }

        return topic;
    }


    getLambdaEnv(){
        return this.environment;
    }
}