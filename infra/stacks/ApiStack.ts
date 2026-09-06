import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { HttpApiConstruct } from "../constructs/base/api/HttpApiConstruct.js";
import { HealthConstruct } from "../constructs/modules/health/HealthConstruct.js";
import { AuthConstruct } from "../constructs/modules/auth/AuthConstruct.js";
import { registerAuthRoutes } from "../routes/AuthRoutes.js";
import { UsersConstruct } from "../constructs/modules/users/UsersConstruct.js";
import { registerHealthRoutes } from "../routes/HealthRoutes.js";
import { registerUsersRoutes } from "../routes/UserRoutes.js";
import { ConfigConstruct } from "../constructs/base/config/ConfigConstruct.js";
import { RolesConstruct } from "../constructs/modules/users/RolesConstruct.js";
import { registerRolesRoutes } from "../routes/RoleRoutes.js";
import { S3Construct } from "../constructs/base/s3/S3Construct.js";
import { AttachmentsConstruct } from "../constructs/modules/attachments/AttachmentsConstruct.js";
import { registerAttachmentRoutes } from "../routes/AttachmentRoutes.js";
import { EventConstruct } from "../constructs/base/event/EventConstruct.js";
import { OutboxWorkerConstruct } from "../constructs/modules/outbox/OutboxWorkerConstruct.js";
import { NotificationsConstruct } from "../constructs/modules/notifications/NotificationsConstruct.js";
import * as events from "aws-cdk-lib/aws-events";
import { SesConstruct } from "../constructs/base/ses/SesConstruct.js";
import { CognitoConstruct } from "../constructs/base/cognito/CognitoConstruct.js";
import { NetworkConstruct } from "../constructs/base/network/NetworkConstruct.js";
import { DatabaseConstruct as DatabaseConstruct } from "../constructs/base/db/DatabaseConstruct.js";


export class ApiStack extends cdk.Stack {

    readonly vpc: ec2.Vpc;
    readonly securityGroups: ec2.ISecurityGroup[];
    readonly userPool: cognito.UserPool;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const env = this.node.tryGetContext("env") ?? "dev";
        const config = this.node.tryGetContext(env);
        //Config: secret manager, ssm
        const configConstruct = new ConfigConstruct(this,"Config");
        //Network
        const networkConstruct = new NetworkConstruct(this,"Network");
        this.vpc = networkConstruct.vpc;
        this.securityGroups = [networkConstruct.lambdaSecurityGroup];
        const lambdaNetwork = {
            vpc:networkConstruct.vpc,
            securityGroups: [networkConstruct.lambdaSecurityGroup]
        }
        //DB
      
        if(env === "local"){
            configConstruct.setDbHostProperty("DB_HOST", config.DB_HOST, env);
        }else{
            const databaseConstruct = new DatabaseConstruct(this,"DB",{
                vpc: networkConstruct.vpc,
                securityGroup: networkConstruct.dbSecurityGroup,
                dbSecret: configConstruct.dbSecret,
                databaseName: configConstruct.dbNameParameter.stringValue
            });
            const db_host = `${databaseConstruct.proxy.endpoint}:${databaseConstruct.instance.dbInstanceEndpointPort}`;
            configConstruct.setDbHostProperty("DB_HOST", db_host, env);
        }
        //Cognito
        const cognitoConstruct = new CognitoConstruct(this,"Cognito");
        this.userPool = cognitoConstruct.userPool;
        //s3
        const s3Construct = new S3Construct(this,"S3");
        //EventBridge EventBus
        const eventBusConstruct = new EventConstruct(this,"EventBus");
        //EventBridge Scheduler
        new OutboxWorkerConstruct(this, "OutboxWorker", configConstruct, eventBusConstruct,lambdaNetwork);
        //SES
        const sesConstruct = new SesConstruct(this, "Ses");

        // HttpApiGateway
        const api = new HttpApiConstruct(this, "HttpApi", {
            env,
            allowedOrigins: config.HTTP_API_GATEWAY_ALLOWED_ORIGINS,
            apiName: "nova-oms-api" 
        });

        // //Lambda Functions
        const health = new HealthConstruct(this, "Health",lambdaNetwork);
        const auth = new AuthConstruct(this, "Auth",configConstruct, cognitoConstruct,lambdaNetwork);
        const user = new UsersConstruct(this, "User",configConstruct,eventBusConstruct,cognitoConstruct,lambdaNetwork);
        const role = new RolesConstruct(this, "Role",configConstruct,cognitoConstruct,lambdaNetwork);
        const attachment = new AttachmentsConstruct(this, "Attachment",configConstruct,s3Construct,eventBusConstruct,cognitoConstruct,lambdaNetwork);
        const notifications = new NotificationsConstruct(this, "Notification",configConstruct,eventBusConstruct,sesConstruct,lambdaNetwork);

        
        //EventBridge Eventbus fan-out user event (userQueue,notificationQueue)
        eventBusConstruct.addEventRule("UserEventRule",{source:["user"],detailType:events.Match.prefix("user.")},[user.userQueue,notifications.notificationQueue]);
        eventBusConstruct.addEventRule("AttachmentEventRule",{source:["attachment"],detailType:events.Match.prefix("attachment.")},[notifications.notificationQueue]);

        //SNS Topic fan-out user event (uploadQueue,notificationQueue)
        const topic = eventBusConstruct.addTopic("Upload",[attachment.uploadQueue,notifications.notificationQueue]);
        //SNS Topic for Cloudwatch alarms to send by email
        eventBusConstruct.addAlarmTopic("DlqAlarm",[attachment.dlqAlarm, notifications.dlqAlarm, user.dlqAlarm]);
        // S3 EventNotification EventType.OBJECT_CREATED_PUT, SnsDestination(topic)
        s3Construct.addConfirmUploadTopicTrigger(topic,"attachments/")
        //Http Routes
        registerAuthRoutes(auth,api);
        registerHealthRoutes(health,api);
        registerUsersRoutes(user,api);
        registerRolesRoutes(role,api);
        registerAttachmentRoutes(attachment,api);


    }
}