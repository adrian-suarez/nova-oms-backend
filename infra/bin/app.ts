import * as cdk from "aws-cdk-lib";
import { ApiStack } from "../stacks/ApiStack.js";
import "dotenv/config";
import { PipelineStack } from "../stacks/PipelineStack.js";

const app = new cdk.App();

const env = app.node.tryGetContext("env") ?? "dev";
const config = app.node.tryGetContext(env);
const pipeline = app.node.tryGetContext("pipeline");

const apiStack = new ApiStack(app, "NovaOmsApiStack", {
  env: {
    region: "us-east-1",
  },
  tags:config.TAGS
});

new PipelineStack(app, "NovaOmsPipelineStack",{
   env: {
    region: "us-east-1",
  },
  tags:config.TAGS,
  vpc:apiStack.vpc,
  securityGroups: apiStack.securityGroups,
  githubConnectionArn: pipeline.GITHUB_CONNECTION_ARN,
  githubOwner: pipeline.GITHUB_OWNER,
  githubRepo: pipeline.GITHUB_REPO,
  deployEnv: env
});

