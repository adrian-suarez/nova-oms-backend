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

            // 128MB (el mínimo de Lambda) no alcanza para una función que carga Prisma Client +
            // el motor de queries + jose/bcryptjs + instrumentación de X-Ray — confirmado con un
            // Runtime.OutOfMemory real en AuthLambda contra RDS Proxy real. 256MB es el default
            // razonable mínimo recomendado para Lambdas con Prisma; subir a 512 si algún endpoint
            // sigue quedándose sin memoria.
            memorySize: props.memorySize ?? 256,
            timeout: cdk.Duration.seconds(props.timeout ?? 15), //30
            entry: path.resolve(props.entry),
            handler:"handler",
            environment:{
                ...config.METADATA,
                ...props.environment           
            },
            tracing:lambda.Tracing.ACTIVE,

            // Mitigación complementaria a RDS Proxy (ADR-0011): limita el techo de invocaciones
            // concurrentes por Lambda. Configurable por ambiente (LAMBDA_RESERVED_CONCURRENCY en
            // cdk.json) en vez de fijo en 50 — cuentas AWS nuevas arrancan con una cuota total de
            // concurrencia mucho más baja que el default de 1000, y reservar 50 por cada una de las
            // 23 Lambdas puede superarla antes de llegar al mínimo de 10 sin reservar que exige AWS.
            // Sin el valor en el contexto, no se reserva nada (deploy nunca bloqueado por esto).
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