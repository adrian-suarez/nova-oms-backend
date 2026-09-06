import { Construct } from "constructs";
import { LambdaNetworkConfig, NodeLambdaFactory } from "../../base/lambda/NodeLambdaFactory.js";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ConfigConstruct } from "../../base/config/ConfigConstruct.js";
import { S3Construct } from "../../base/s3/S3Construct.js";
import { EventConstruct } from "../../base/event/EventConstruct.js";
import { CognitoConstruct } from "../../base/cognito/CognitoConstruct.js";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

export class AttachmentsConstruct extends Construct {
    public readonly generateUploadUrlLambdaFunction :NodejsFunction;
    public readonly generateDownloadUrlLambdaFunction:NodejsFunction;

    public readonly getAttachmentLambdaFunction:NodejsFunction ;
    public readonly getAttachmentsLambdaFunction:NodejsFunction ;
    public readonly deleteAttachmentLambdaFunction:NodejsFunction ;

    public readonly uploadQueueConsumerLambdaFunction:NodejsFunction ;
    public uploadQueue: sqs.Queue;
    public dlqAlarm: cloudwatch.Alarm;

    constructor(scope: Construct, id:string,
        configConstruct:ConfigConstruct,
        s3Construct:S3Construct,
        eventBusConstruct:EventConstruct,
        cognitoConstruct:CognitoConstruct,
        lambdaNetworkConfig:LambdaNetworkConfig){
        super(scope,id);

        // Los 5 endpoints HTTP de attachments son authenticated:true (la queue no, no expone
        // HTTP) — AuthenticationBehavior verifica el JWT en cada request, y eso necesita
        // userPoolId/clientId aunque ninguno de estos handlers llame a la API admin de Cognito.
        this.generateUploadUrlLambdaFunction = NodeLambdaFactory.create(this,"GenerateUploadUrlLambda",{
            entry:"src/lambdas/attachments/upload.ts",
            environment:{...configConstruct.getLambdaEnv(), ...s3Construct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.generateUploadUrlLambdaFunction);
        s3Construct.grantReadConfig(this.generateUploadUrlLambdaFunction);
        s3Construct.grantPut(this.generateUploadUrlLambdaFunction);
        cognitoConstruct.grantReadConfig(this.generateUploadUrlLambdaFunction);


        this.generateDownloadUrlLambdaFunction = NodeLambdaFactory.create(this,"GenerateDownloadUrlLambda",{
            entry:"src/lambdas/attachments/download.ts",
            environment:{...configConstruct.getLambdaEnv(), ...s3Construct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.generateDownloadUrlLambdaFunction);
        s3Construct.grantReadConfig(this.generateDownloadUrlLambdaFunction);
        s3Construct.grantRead(this.generateDownloadUrlLambdaFunction);
        cognitoConstruct.grantReadConfig(this.generateDownloadUrlLambdaFunction);

        this.getAttachmentLambdaFunction = NodeLambdaFactory.create(this,"GetAttachmentLambda",{
            entry:"src/lambdas/attachments/get.ts",
            environment:{...configConstruct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.getAttachmentLambdaFunction);
        cognitoConstruct.grantReadConfig(this.getAttachmentLambdaFunction);

        this.getAttachmentsLambdaFunction = NodeLambdaFactory.create(this,"GetAttachmentsLambda",{
            entry:"src/lambdas/attachments/list.ts",
            environment:{...configConstruct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.getAttachmentsLambdaFunction);
        cognitoConstruct.grantReadConfig(this.getAttachmentsLambdaFunction);

        this.deleteAttachmentLambdaFunction = NodeLambdaFactory.create(this,"DeleteAttachmentLambda",{
            entry:"src/lambdas/attachments/delete.ts",
            environment:{
                ...configConstruct.getLambdaEnv(),
                ...s3Construct.getLambdaEnv(),
                ...eventBusConstruct.getLambdaEnv(),
                ...cognitoConstruct.getLambdaEnv()
            },
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.deleteAttachmentLambdaFunction);
        s3Construct.grantReadConfig(this.deleteAttachmentLambdaFunction);
        s3Construct.grantReadWrite(this.deleteAttachmentLambdaFunction);
        eventBusConstruct.grantReadConfig(this.deleteAttachmentLambdaFunction);
        eventBusConstruct.grantPutEvents(this.deleteAttachmentLambdaFunction);
        cognitoConstruct.grantReadConfig(this.deleteAttachmentLambdaFunction);

        this.uploadQueueConsumerLambdaFunction = NodeLambdaFactory.create(this,"UploadQueueConsumerLambda",{
            entry:"src/lambdas/attachments/queue.ts",
            environment:{
                ...configConstruct.getLambdaEnv(),
                ...s3Construct.getLambdaEnv(),
                ...eventBusConstruct.getLambdaEnv()
            },
            memorySize:1024,
            timeout:60,
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.uploadQueueConsumerLambdaFunction);
        s3Construct.grantReadConfig(this.uploadQueueConsumerLambdaFunction);
        s3Construct.grantReadWrite(this.uploadQueueConsumerLambdaFunction);
        eventBusConstruct.grantReadConfig(this.uploadQueueConsumerLambdaFunction);
        eventBusConstruct.grantPutEvents(this.uploadQueueConsumerLambdaFunction);

        const {queue, dlqAlarm} = eventBusConstruct.addQueueConsumer(this,"Upload", this.uploadQueueConsumerLambdaFunction,90);
        this.uploadQueue = queue;
        this.dlqAlarm = dlqAlarm;

    }

}