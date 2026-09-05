import { Construct } from "constructs";
import { LambdaNetworkConfig, NodeLambdaFactory } from "../../base/lambda/NodeLambdaFactory.js";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ConfigConstruct } from "../../base/config/ConfigConstruct.js";

export class RolesConstruct extends Construct {
    public readonly getRoleLambdaFunction :NodejsFunction;
    public readonly getRolesLambdaFunction :NodejsFunction;
    public readonly createRoleLambdaFunction :NodejsFunction;
    public readonly updateRoleLambdaFunction :NodejsFunction;
    public readonly deleteRoleLambdaFunction :NodejsFunction;


    constructor(scope: Construct, id:string,
        configConstruct:ConfigConstruct,
        lambdaNetworkConfig:LambdaNetworkConfig
    ){
        super(scope,id);

        this.getRoleLambdaFunction = NodeLambdaFactory.create(this,"GetRoleLambda",{
            entry:"src/lambdas/roles/get.ts",
            environment: configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });
        configConstruct.grantReadConfig(this.getRoleLambdaFunction);

        this.getRolesLambdaFunction = NodeLambdaFactory.create(this,"GetRolesLambda",{
            entry:"src/lambdas/roles/list.ts",
            environment: configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.getRolesLambdaFunction);

        this.createRoleLambdaFunction = NodeLambdaFactory.create(this,"CreateRoleLambda",{
            entry:"src/lambdas/roles/create.ts",
            environment: configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.createRoleLambdaFunction);

        this.updateRoleLambdaFunction = NodeLambdaFactory.create(this,"UpdateRoleLambda",{
            entry:"src/lambdas/roles/update.ts",
            environment: configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.updateRoleLambdaFunction);

        this.deleteRoleLambdaFunction = NodeLambdaFactory.create(this,"DeleteRoleLambda",{
            entry:"src/lambdas/roles/delete.ts",
            environment: configConstruct.getLambdaEnv(),
            vpc: lambdaNetworkConfig.vpc,
            securityGroups: lambdaNetworkConfig.securityGroups
        });

        configConstruct.grantReadConfig(this.deleteRoleLambdaFunction);

    }

}