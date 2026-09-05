import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito"
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";

export class CognitoConstruct extends Construct{

    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    readonly userPoolIdParameter: ssm.StringParameter;
    readonly userPoolClientIdParameter: ssm.StringParameter;
    readonly environment;
    constructor(scope:Construct, id:string){
        super(scope,id);

        const env = this.node.tryGetContext("env") ?? "dev";
        const config = this.node.tryGetContext(env);

        this.userPool = new cognito.UserPool(this,"NovaOmsUserPool",{
            userPoolName: `novaoms-${env}-user-pool`,
            selfSignUpEnabled: false,
            signInAliases:{email:true},
            autoVerify: {email:true},
            standardAttributes:{
                givenName: { required: true, mutable:true},
                familyName: { required:true, mutable:true}
            },
            passwordPolicy:{
                minLength:8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: env ==="prod"? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
        });

        this.userPoolClient = this.userPool.addClient("NovaOmsUserPoolClient",{
            userPoolClientName: `novaoms-${env}-user-backend-pool-client`,
            generateSecret: false,
            authFlows:{
                adminUserPassword:true,
                userSrp:false
            },
            refreshTokenValidity: cdk.Duration.days(Number(config.JWT_REFRESH_TOKEN_DAYS ?? 30)),
            accessTokenValidity: cdk.Duration.hours(Number(config.JWT_EXPIRATION_TIME ?? 24))
        });

        this.userPoolIdParameter = new ssm.StringParameter(this,"CognitoUserPoolId",{
            parameterName: `/novaoms/${env}/cognito/user_pool_id`,
            stringValue: this.userPool.userPoolId
        });

        this.userPoolClientIdParameter = new ssm.StringParameter(this, "CognitoUserPoolClientId",{
            parameterName: `/novaoms/${env}/cognito/client_id`,
            stringValue: this.userPoolClient.userPoolClientId
        });

        this.environment = {
            AWS_COGNITO_USER_POOL_ID: this.userPoolIdParameter.stringValue,
            AWS_COGNITO_CLIENT_ID: this.userPoolClientIdParameter.stringValue
        }

        new cdk.CfnOutput(this, "CognitoUserPoolIdOutput", {
            value: this.userPool.userPoolId,
        });

        new cdk.CfnOutput(this, "CognitoUserPoolClientIdOutput", {
            value: this.userPoolClient.userPoolClientId,
        });


    }

    getLambdaEnv(){
        return this.environment;
    }

    grantReadConfig(lambdaFunction:NodejsFunction){
        this.userPoolIdParameter.grantRead(lambdaFunction);
        this.userPoolClientIdParameter.grantRead(lambdaFunction);
    }

    grantAdminAuth(lambdaFunction:NodejsFunction){
        lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
            actions:[
                "cognito-idp:AdminInitiateAuth",
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminUpdateUserAttributes",
                "cognito-idp:AdminDeleteUser",
                "cognito-idp:AdminEnableUser",
                "cognito-idp:AdminDisableUser",
                "cognito-idp:AdminSetUserPassword",
                "cognito-idp:GlobalSignOut",
            ],
            //localstack
            resources: ["*"]
            //aws
            //resources: [this.userPool.userPoolArn]

        }));
    }

}