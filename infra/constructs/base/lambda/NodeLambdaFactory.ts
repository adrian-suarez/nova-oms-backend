import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { LogRetention, RetentionDays } from "aws-cdk-lib/aws-logs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface NodeLambdaFactoryProps{
    entry:string;
    description?:string;
    environment?:Record<string,string>;
    timeout?:number;
    memorySize?:number;

    vpc?:ec2.Vpc;
    securityGroups?: ec2.ISecurityGroup[];
}

export interface LambdaNetworkConfig{
    vpc:ec2.Vpc;
    securityGroups: ec2.ISecurityGroup[];
}

export class NodeLambdaFactory{
    static create(scope:Construct, id:string, props:NodeLambdaFactoryProps): NodejsFunction{
        
        const env = scope.node.tryGetContext("env") ?? "dev";
        const config = scope.node.tryGetContext(env);
        const isProd = env === "prod";

        const lambdaFunction =  new NodejsFunction(scope,id,{
            functionName:`NovaOms-${id}`,
            runtime: lambda.Runtime.NODEJS_24_X,

            vpc:props.vpc,
            securityGroups:props.securityGroups,

            // 128MB (mínimo de Lambda) no alcanza para Prisma + jose/bcryptjs + X-Ray — confirmado
            // con Runtime.OutOfMemory real en AuthLambda. Subir a 512 si algún endpoint lo necesita.
            memorySize: props.memorySize ?? 256,
            timeout: cdk.Duration.seconds(props.timeout ?? 15), //30
            entry: path.resolve(props.entry),
            handler:"handler",
            environment:{
                ...config.METADATA,
                ...props.environment           
            },
            tracing:lambda.Tracing.ACTIVE,

            // Complementa RDS Proxy (ADR-0011). Configurable por ambiente en vez de fijo: cuentas
            // AWS nuevas pueden tener una cuota de concurrencia total muy baja, y reservar un valor
            // fijo por cada Lambda puede violar el mínimo de 10 sin reservar que exige AWS.
            reservedConcurrentExecutions: config.LAMBDA_RESERVED_CONCURRENCY,
            depsLockFilePath: path.resolve("pnpm-lock.yaml"),    //building reproducible
            bundling: { 
                target:"node24",        // version node para transpilar codigo
                format:OutputFormat.CJS, // formato del bundle ECMAScript import/export, da error, mejor CJS common js require
                minify: isProd,           // reduccion de bundle desarrollo false, prod true
                sourceMap: !isProd,        // genera archivo .map para depurar el codgo original ts, util para rastrear errores
                sourcesContent:!isProd,    // incluye contenido original dentro de sourceMap
                keepNames: true,        // mantener nombres de clases
            },
        });


        new LogRetention(scope,`${id}LogRetention`,{
            logGroupName: `/aws/lambda/${lambdaFunction.functionName}`,
            retention: RetentionDays.ONE_MONTH
        })


        return lambdaFunction;

    }
}