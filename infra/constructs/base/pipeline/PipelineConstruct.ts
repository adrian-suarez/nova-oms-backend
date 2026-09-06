import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";


export interface PipelineConstructProps {
    vpc: ec2.Vpc,
    securityGroups: ec2.ISecurityGroup[],
    githubConnectionArn: string;
    githubOwner: string;
    githubRepo: string;
    deployEnv: "dev" |"qa"|"prod";
}

export class PipelineConstruct extends Construct {
    constructor(scope:Construct, id:string, props: PipelineConstructProps){
        super(scope,id);

        const sourceOutput = new codepipeline.Artifact("SourceOutput");
        const buildOutput = new codepipeline.Artifact("BuildOutput");

        const buildProject = new codebuild.PipelineProject(this,"BuildProject",{
            buildSpec: codebuild.BuildSpec.fromSourceFilename("pipeline/buildspecs/build.yml"),
            environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5},
            // Cachea el store de pnpm (fijado a .pnpm-store por .npmrc) entre corridas del mismo
            // build host — evita descargar todo de cero en cada push. Best-effort: si CodeBuild
            // asigna un host distinto, simplemente no hay cache hit, no rompe nada.
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.CUSTOM)
        });

        const deployProject = new codebuild.PipelineProject(this,"DeployProject",{
            buildSpec: codebuild.BuildSpec.fromSourceFilename("pipeline/buildspecs/deploy.yml"),
            environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5},
            environmentVariables:{ DEPLOY_ENV: {value: props.deployEnv}}
        });

        deployProject.addToRolePolicy(new iam.PolicyStatement({
            actions: ["sts:AssumeRole"],
            resources:[`arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/cdk-*`]
        }));

        // AUTH_PROVIDER no es un valor dinámico ni sensible — ya está en el contexto de CDK al
        // sintetizar (mismo valor que reciben las Lambdas reales), no hace falta ir a buscarlo a
        // SSM en runtime. Sin esto, prisma/seed.ts nunca crea usuarios en Cognito aunque
        // AUTH_PROVIDER=cognito para el resto del stack, porque config.authProvider lee de
        // process.env y ese env var nunca llegaba a este CodeBuild.
        const config = this.node.tryGetContext(props.deployEnv);

        const migrateProject = new codebuild.PipelineProject(this,"MigrateAndSeedProject",{
            vpc: props.vpc,
            securityGroups: props.securityGroups,
            buildSpec: codebuild.BuildSpec.fromSourceFilename("pipeline/buildspecs/migrate-and-seed.yml"),
            environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5},
            environmentVariables:{
                DEPLOY_ENV: {value: props.deployEnv},
                AUTH_PROVIDER: {value: config.AUTH_PROVIDER},
            },
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.CUSTOM)
        });

        migrateProject.addToRolePolicy(new iam.PolicyStatement({
            // CodeBuild resuelve las variables de "parameter-store" del buildspec con la API en
            // lote (GetParameters, plural) cuando hay más de una — acá hay 4. GetParameter
            // (singular) por sí solo no alcanza, aunque el nombre sea casi idéntico.
            actions: ["ssm:GetParameter", "ssm:GetParameters"],
            resources: [
                `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/novaoms/${props.deployEnv}/db/host`,
                `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/novaoms/${props.deployEnv}/db/name`,
                `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/novaoms/${props.deployEnv}/cognito/user_pool_id`,
                `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/novaoms/${props.deployEnv}/cognito/client_id`
            ],
        }));

    
        const dbSecret = secretsmanager.Secret.fromSecretNameV2(this, "DbSecretRef", `novaoms/${props.deployEnv}/db`);

        dbSecret.grantRead(migrateProject);


        const pipeline = new codepipeline.Pipeline(this,"Pipeline",{
            pipelineName: `nova-oms-pipeline-${props.deployEnv}`,
            pipelineType: codepipeline.PipelineType.V2,
            stages:[
                {
                    stageName:"Source",
                    actions:[
                        new actions.CodeStarConnectionsSourceAction({
                            actionName:"GitHub_Source",
                            connectionArn:props.githubConnectionArn,
                            owner: props.githubOwner,
                            repo: props.githubRepo,
                            branch: props.deployEnv ==="prod" ? "main" : "develop",
                            output: sourceOutput
                        })
                    ]
                },{
                    stageName:"Build",
                    actions:[
                        new actions.CodeBuildAction({
                            actionName:"Build_Test_Synth",
                            project: buildProject,
                            input: sourceOutput,
                            outputs:[buildOutput]
                        })
                    ]
                },{
                    stageName:"Deploy",
                    actions:[
                        new actions.CodeBuildAction({
                            actionName:"CDK_Deploy",
                            project: deployProject,
                            // El buildspec (deploy.yml) vive en el código fuente, no en el
                            // artefacto de Build (que solo trae cdk.out/) — CodeBuild busca el
                            // buildspec en el input PRIMARIO, así que la fuente cruda tiene que
                            // ser el input principal. El cdk.out sintetizado llega como input
                            // secundario, accesible en $CODEBUILD_SRC_DIR_BuildOutput.
                            input: sourceOutput,
                            extraInputs: [buildOutput]
                        })
                    ]
                },{
                    stageName:"MigrateAndSeed",
                    actions:[
                        new actions.CodeBuildAction({
                            actionName:"Prisma_Migrate_And_Seed",
                            project: migrateProject,
                            input: sourceOutput
                        })
                    ]
                }
            ]
        });


        new cdk.CfnOutput(this, "PipelineName", {
            value: pipeline.pipelineName,
        });

        
    }
}