import { Construct } from "constructs";
import * as cdk  from "aws-cdk-lib"
import * as s3  from "aws-cdk-lib/aws-s3"
import * as s3n  from "aws-cdk-lib/aws-s3-notifications"

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";


export class S3Construct extends Construct{

    readonly bucket: s3.Bucket;

    readonly bucketParameter: ssm.StringParameter;
    readonly expirationParameter: ssm.StringParameter;
    readonly maxFileSizeParameter: ssm.StringParameter;
    readonly allowedExtensionsParameter: ssm.StringParameter;
    readonly allowedContentTypesParameter: ssm.StringParameter;

    readonly environment;
    constructor(scope: Construct, id: string){
        super(scope,id);
        const env = this.node.tryGetContext("env") ?? "dev";
        const config = this.node.tryGetContext(env);

        this.bucket =new s3.Bucket(this,"AttachmentsBucket",{
            bucketName: `novaoms-${env}-attachments`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            versioned:true,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED, // bucket is owner of all object, access with iam role
            autoDeleteObjects:env != "prod",                            // when cdk destroy delete all objects
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,           // Deny access to bucket on internet
            removalPolicy: env == "prod"? cdk.RemovalPolicy.RETAIN:cdk.RemovalPolicy.DESTROY,           // when cdk destroy and it hasn't object the bucket will be deleted correctly
            cors:[
                {
                    allowedMethods:[
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.GET,
                        s3.HttpMethods.HEAD
                    ],
                    allowedOrigins: config.CORS_ORIGINS ?? ["*"],
                    allowedHeaders:["*"]
                }
            ],
            lifecycleRules:[
                {
                    abortIncompleteMultipartUploadAfter: cdk.Duration.days(7)
                },
                {
                    noncurrentVersionExpiration: cdk.Duration.days(30)
                }
            ]
        });


        this.bucketParameter = new ssm.StringParameter(this, "BucketParameter", {
            parameterName: `/novaoms/${env}/s3/bucket`,
            stringValue: this.bucket.bucketName,
        });
    
        this.expirationParameter = new ssm.StringParameter(this, "ExpirationParameter", {
            parameterName: `/novaoms/${env}/s3/expiration`,
            stringValue: config.AWS_S3_EXPIRATION,
        });
    
        this.maxFileSizeParameter = new ssm.StringParameter(this, "MaxFileSizeParameter", {
            parameterName: `/novaoms/${env}/s3/max_file_size`,
            stringValue: config.AWS_S3_MAX_FILE_SIZE,
        });
    
        this.allowedExtensionsParameter = new ssm.StringParameter(this, "AllowedExtensionsParameter", {
            parameterName: `/novaoms/${env}/s3/allowed_extensions`,
            stringValue: config.AWS_S3_ALLOWED_EXTENSIONS,
        });
    
        this.allowedContentTypesParameter= new ssm.StringParameter(this, "AllowedContentTypesParameter", {
            parameterName: `/novaoms/${env}/s3/allowed_content_types`,
            stringValue: config.AWS_S3_ALLOWED_CONTENT_TYPES,
        });
    
        this.environment = {
            AWS_S3_BUCKET: this.bucketParameter.stringValue,
            AWS_S3_EXPIRATION: this.expirationParameter.stringValue,
            AWS_S3_MAX_FILE_SIZE: this.maxFileSizeParameter.stringValue,
            AWS_S3_ALLOWED_EXTENSIONS: this.allowedExtensionsParameter.stringValue,
            AWS_S3_ALLOWED_CONTENT_TYPES: this.allowedContentTypesParameter.stringValue,
            ...(config.AWS_S3_FORCE_PATH_STYLE && { AWS_S3_FORCE_PATH_STYLE: config.AWS_S3_FORCE_PATH_STYLE }),
        };

        new cdk.CfnOutput(this, "AttachmentsBucketName", {
            value: this.bucket.bucketName,
        });

    }

    getLambdaEnv() {
        return this.environment;
    }

    grantReadConfig(lambdaFunction: NodejsFunction) {
        this.bucketParameter.grantRead(lambdaFunction);
        this.expirationParameter.grantRead(lambdaFunction);
        this.maxFileSizeParameter.grantRead(lambdaFunction);
        this.allowedExtensionsParameter.grantRead(lambdaFunction);
        this.allowedContentTypesParameter.grantRead(lambdaFunction);
    }
    grantPut(lambdaFunction: NodejsFunction){
        this.bucket.grantPut(lambdaFunction);
    }
    grantRead(lambdaFunction: NodejsFunction){
        this.bucket.grantRead(lambdaFunction);
    }
    grantDelete(lambdaFunction: NodejsFunction){
        this.bucket.grantDelete(lambdaFunction);
    }
    grantReadWrite(lambdaFunction: NodejsFunction){
        this.bucket.grantReadWrite(lambdaFunction);
    }
   
    addConfirmUploadTrigger( queue:sqs.Queue,  prefix:string){
        this.bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED_PUT,
            new s3n.SqsDestination(queue),
            {prefix}
        );
    }

    addConfirmUploadTopicTrigger( topic:sns.Topic,  prefix:string){
        this.bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED_PUT,
            new s3n.SnsDestination(topic),
            {prefix}
        );
    }
}