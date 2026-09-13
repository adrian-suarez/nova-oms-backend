import { Construct } from "constructs";
import { LambdaNetworkConfig, NodeLambdaFactory } from "../../base/lambda/NodeLambdaFactory.js";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ConfigConstruct } from "../../base/config/ConfigConstruct.js";
import { CognitoConstruct } from "../../base/cognito/CognitoConstruct.js";

export class RolesConstruct extends Construct {
    public readonly getRoleLambdaFunction :NodejsFunction;
    public readonly getRolesLambdaFunction :NodejsFunction;
    public readonly createRoleLambdaFunction :NodejsFunction;
    public readonly updateRoleLambdaFunction :NodejsFunction;
    public readonly deleteRoleLambdaFunction :NodejsFunction;


    constructor(scope: Construct, id:string,
        configConstruct:ConfigConstruct,
        cognitoConstruct:CognitoConstruct,
        lambdaNetworkConfig:LambdaNetworkConfig
    ){
        super(scope,id);

        // Los 5 endpoints de roles son authenticated:true — AuthenticationBehavior verifica el
        // JWT en cada request, y eso necesita userPoolId/clientId aunque ninguno de estos
        // handlers llame a la API admin de Cognito. Sin esto, authenticate() fallaba con
        // "Invalid token" para cualquier token válido.
        this.getRoleLambdaFunction = NodeLambdaFactory.create(this,"GetRoleLambda",{
            entry:"src/lambdas/roles/get.ts",
            environment: {...configConstruct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.getRoleLambdaFunction);
        cognitoConstruct.grantReadConfig(this.getRoleLambdaFunction);

        this.getRolesLambdaFunction = NodeLambdaFactory.create(this,"GetRolesLambda",{
            entry:"src/lambdas/roles/list.ts",
            environment: {...configConstruct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.getRolesLambdaFunction);
        cognitoConstruct.grantReadConfig(this.getRolesLambdaFunction);

        this.createRoleLambdaFunction = NodeLambdaFactory.create(this,"CreateRoleLambda",{
            entry:"src/lambdas/roles/create.ts",
            environment: {...configConstruct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.createRoleLambdaFunction);
        cognitoConstruct.grantReadConfig(this.createRoleLambdaFunction);

        this.updateRoleLambdaFunction = NodeLambdaFactory.create(this,"UpdateRoleLambda",{
            entry:"src/lambdas/roles/update.ts",
            environment: {...configConstruct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.updateRoleLambdaFunction);
        cognitoConstruct.grantReadConfig(this.updateRoleLambdaFunction);

        this.deleteRoleLambdaFunction = NodeLambdaFactory.create(this,"DeleteRoleLambda",{
            entry:"src/lambdas/roles/delete.ts",
            environment: {...configConstruct.getLambdaEnv(), ...cognitoConstruct.getLambdaEnv()},
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.deleteRoleLambdaFunction);
        cognitoConstruct.grantReadConfig(this.deleteRoleLambdaFunction);

    }

}