import { Construct } from "constructs";
import { LambdaNetworkConfig, NodeLambdaFactory } from "../../base/lambda/NodeLambdaFactory.js";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";


export class HealthConstruct extends Construct {
  public readonly lambdaFunction : NodejsFunction
  constructor(scope: Construct, id:string,
    lambdaNetworkConfig:LambdaNetworkConfig) {
    super(scope, id);

    this.lambdaFunction = NodeLambdaFactory.create(this, "HealthLambda",{
      entry:"src/lambdas/health/get.ts",
      vpc: lambdaNetworkConfig.vpc,
      securityGroups: lambdaNetworkConfig.securityGroups
    });

  }
}
