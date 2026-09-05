import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import * as ses from "aws-cdk-lib/aws-ses";
import * as cr from "aws-cdk-lib/custom-resources";
import * as iam from "aws-cdk-lib/aws-iam";


export class SesConstruct extends Construct {

  readonly emailAddress: ssm.StringParameter;
  emailIdentity:ses.EmailIdentity | undefined;
  readonly environment;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const env = this.node.tryGetContext("env") ?? "dev";
    const config = this.node.tryGetContext(env);


    this.emailAddress = new ssm.StringParameter(this, "SesEmailAddress", {
      parameterName: `/novaoms/${env}/ses/email_address`,
      stringValue: config.SES_EMAIL_ADDRESS,
    });

    this.environment = {
      SES_EMAIL_ADDRESS: this.emailAddress.stringValue
    };
    if(config.AWS_ENDPOINT_URL){
      this.provisionLocal(config.SES_EMAIL_ADDRESS);
    }else{
      this.provision();
    }

  }

  private provisionLocal(email:String){

     new cr.AwsCustomResource(this, "SesVerifyEmailIdentity", {
      installLatestAwsSdk:false,
        onCreate: {
            service: "SES",
            action: "verifyEmailIdentity",
            parameters: {
              EmailAddress: email,
            },
            physicalResourceId: cr.PhysicalResourceId.of(`ses-identity-${email}`),
        },
        onDelete: {
            service: "SES",
            action: "deleteIdentity",
            parameters: {
                Identity: email
            },
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
            resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
    });
  }

  private provision(){
    this.emailIdentity = new ses.EmailIdentity(this,"SesEmailIdentity",{
      identity: ses.Identity.email(this.emailAddress.stringValue)
    });
  }

  getLambdaEnv() {
    return this.environment;
  }

  grantReadConfig(lambdaFunction: NodejsFunction) {
    this.emailAddress.grantRead(lambdaFunction);
  }

  grantSendEmail(lambdaFunction: NodejsFunction) {
    //this.emailIdentity.grantSendEmail(lambdaFunction);
    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
      }));
  }
}
