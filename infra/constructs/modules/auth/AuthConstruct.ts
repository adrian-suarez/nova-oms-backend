import { Construct } from "constructs";
import { LambdaNetworkConfig, NodeLambdaFactory } from "../../base/lambda/NodeLambdaFactory.js";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ConfigConstruct } from "../../base/config/ConfigConstruct.js";
import { CognitoConstruct } from "../../base/cognito/CognitoConstruct.js";


export class AuthConstruct extends Construct{
    public readonly lambdaFunction : NodejsFunction;

    constructor(scope:Construct, id: string,
        configConstruct:ConfigConstruct,
        cognitoConstruct:CognitoConstruct,
        lambdaNetworkConfig:LambdaNetworkConfig){
        super(scope,id);

        this.lambdaFunction = NodeLambdaFactory.create(this,"AuthLambda",{
            entry:"src/lambdas/auth/login.ts",
            description: "Auth Lambda Function",
            environment: {...configConstruct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.lambdaFunction);
        cognitoConstruct.grantReadConfig(this.lambdaFunction);
        cognitoConstruct.grantAdminAuth(this.lambdaFunction);

    }
}