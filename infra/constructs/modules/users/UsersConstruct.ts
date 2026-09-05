import { Construct } from "constructs";
import { LambdaNetworkConfig, NodeLambdaFactory } from "../../base/lambda/NodeLambdaFactory.js";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ConfigConstruct } from "../../base/config/ConfigConstruct.js";
import { EventConstruct } from "../../base/event/EventConstruct.js";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { CognitoConstruct } from "../../base/cognito/CognitoConstruct.js";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

export class UsersConstruct extends Construct {
    public readonly getCurrentUserLambdaFunction :NodejsFunction;
    public readonly getUserLambdaFunction :NodejsFunction;
    public readonly getUsersLambdaFunction :NodejsFunction;
    public readonly createUserLambdaFunction :NodejsFunction;
    public readonly updateUserLambdaFunction :NodejsFunction;
    public readonly deleteUserLambdaFunction :NodejsFunction;
    public readonly userQueue :sqs.Queue;
    public dlqAlarm: cloudwatch.Alarm;


    constructor(scope: Construct, id:string,
        configConstruct:ConfigConstruct,
        eventBusConstruct:EventConstruct,
        cognitoConstruct:CognitoConstruct,
        lambdaNetworkConfig:LambdaNetworkConfig
    ){
        super(scope,id);

        this.getCurrentUserLambdaFunction = NodeLambdaFactory.create(this,"GetCurrentUserLambda",{
            entry:"src/lambdas/users/current.ts",
            environment:configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.getCurrentUserLambdaFunction);

        this.getUserLambdaFunction = NodeLambdaFactory.create(this,"GetUserLambda",{
            entry:"src/lambdas/users/get.ts",
            environment: configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.getUserLambdaFunction);

        this.getUsersLambdaFunction = NodeLambdaFactory.create(this,"GetUsersLambda",{
            entry:"src/lambdas/users/list.ts",
            environment: configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.getUsersLambdaFunction);

        this.createUserLambdaFunction = NodeLambdaFactory.create(this,"CreateUserLambda",{
            entry:"src/lambdas/users/create.ts",
            environment: {
                ...configConstruct.getLambdaEnv(),
                ...eventBusConstruct.getLambdaEnv(),
                ...cognitoConstruct.getLambdaEnv()
            },
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.createUserLambdaFunction);
        eventBusConstruct.grantReadConfig(this.createUserLambdaFunction);
        eventBusConstruct.grantPutEvents(this.createUserLambdaFunction);
        cognitoConstruct.grantReadConfig(this.createUserLambdaFunction);
        cognitoConstruct.grantAdminAuth(this.createUserLambdaFunction);

        this.updateUserLambdaFunction = NodeLambdaFactory.create(this,"UpdateUserLambda",{
            entry:"src/lambdas/users/update.ts",
            environment: {
                ...configConstruct.getLambdaEnv(),
                ...eventBusConstruct.getLambdaEnv(),
                ...cognitoConstruct.getLambdaEnv()
            },
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.updateUserLambdaFunction);
        eventBusConstruct.grantReadConfig(this.updateUserLambdaFunction);
        eventBusConstruct.grantPutEvents(this.updateUserLambdaFunction);
        cognitoConstruct.grantReadConfig(this.updateUserLambdaFunction);
        cognitoConstruct.grantAdminAuth(this.updateUserLambdaFunction);

        this.deleteUserLambdaFunction = NodeLambdaFactory.create(this,"DeleteUserLambda",{
            entry:"src/lambdas/users/delete.ts",
            environment: {
                ...configConstruct.getLambdaEnv(),
                ...eventBusConstruct.getLambdaEnv(),
                ...cognitoConstruct.getLambdaEnv()
            },
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.deleteUserLambdaFunction);
        eventBusConstruct.grantReadConfig(this.deleteUserLambdaFunction);
        eventBusConstruct.grantPutEvents(this.deleteUserLambdaFunction);
        cognitoConstruct.grantReadConfig(this.deleteUserLambdaFunction);
        cognitoConstruct.grantAdminAuth(this.deleteUserLambdaFunction);

        //Consumer Lambda Function
        const userQueueConsumerLambdaFunction = NodeLambdaFactory.create(this,"UserQueueConsumerLambda",{
            entry:"src/lambdas/users/queue.ts",
            environment: configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        //Queue
        const {queue, dlqAlarm} = eventBusConstruct.addQueueConsumer(this,"User",userQueueConsumerLambdaFunction);
        configConstruct.grantReadConfig(userQueueConsumerLambdaFunction);
        this.userQueue=queue;
        this.dlqAlarm = dlqAlarm;


    }

}