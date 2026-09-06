import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { PipelineConstruct } from "../constructs/base/pipeline/PipelineConstruct.js";

export interface PipelineStackProps extends cdk.StackProps {
    vpc: ec2.Vpc,
    securityGroups: ec2.ISecurityGroup[],
    userPool: cognito.IUserPool;
    githubConnectionArn: string;
    githubOwner: string;
    githubRepo: string;
    deployEnv: "dev" |"qa"|"prod";
}


export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id:string,props: PipelineStackProps){
        super(scope,id,props);

        new PipelineConstruct(this,"Pipeline",{
            vpc: props.vpc,
            securityGroups: props.securityGroups,
            userPool: props.userPool,
            githubConnectionArn: props.githubConnectionArn,
            githubOwner: props.githubOwner,
            githubRepo: props.githubRepo,
            deployEnv: props.deployEnv
        });
    }
}