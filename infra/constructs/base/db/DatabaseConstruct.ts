import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as sm from "aws-cdk-lib/aws-secretsmanager"
import * as rds from "aws-cdk-lib/aws-rds";
import * as cdk from "aws-cdk-lib";

export interface DBConstructProps {
    vpc: ec2.Vpc;
    securityGroup: ec2.SecurityGroup;
    dbSecret: sm.Secret;
    databaseName: string;
}

export class DatabaseConstruct extends Construct {

    readonly instance: rds.DatabaseInstance;
    readonly proxy: rds.DatabaseProxy;

    constructor(scope:Construct, id:string, props:DBConstructProps){
        super(scope,id);

        const env = this.node.tryGetContext("env") ?? "dev";

        this.instance = new rds.DatabaseInstance(this,"NovaOmsDB",{
            engine: rds.DatabaseInstanceEngine.postgres({version:rds.PostgresEngineVersion.VER_17}),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
            vpc: props.vpc,
            vpcSubnets: {subnetType:ec2.SubnetType.PRIVATE_ISOLATED},
            securityGroups:[props.securityGroup],
            credentials: rds.Credentials.fromSecret(props.dbSecret),
            databaseName: props.databaseName,
            allocatedStorage: 20,
            storageType: rds.StorageType.GP3,
            storageEncrypted:true,
            multiAz: false,
            deletionProtection: env ==="prod",
            removalPolicy: env === "prod" ? cdk.RemovalPolicy.SNAPSHOT: cdk.RemovalPolicy.DESTROY,
            backupRetention: cdk.Duration.days(env === "prod"? 7:1)
        });

        // RDS Proxy para gestionar el pool de conexiones
        // mejora para no agotar las conexiones a db
        // directa desde los clientes lambda.
        this.proxy = new rds.DatabaseProxy(this, "NovaOmsDbProxy", {
            proxyTarget: rds.ProxyTarget.fromInstance(this.instance),
            secrets:[props.dbSecret],
            vpc: props.vpc,
            securityGroups: [props.securityGroup]
        });

        new cdk.CfnOutput(this, "DatabaseEndpoint", {
            value: `${this.instance.dbInstanceEndpointAddress}:${this.instance.dbInstanceEndpointPort}`,
        });

    }
}