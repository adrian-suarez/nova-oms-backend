import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { NodeLambdaFactory } from "../lambda/NodeLambdaFactory.js";

export class ConfigConstruct extends Construct {
  readonly jwtSecret: secretsmanager.Secret;
  readonly dbSecret: secretsmanager.Secret;
  private dbHostParameter: ssm.StringParameter | null = null ;
  readonly dbNameParameter: ssm.StringParameter;
  readonly jwtAccessTokenExpiresParameter: ssm.StringParameter;
  readonly jwtExpirationTimeParameter: ssm.StringParameter;
  readonly jwtRefreshTokenDaysParameter: ssm.StringParameter;

  readonly localDBUser: ssm.StringParameter | null = null;
  readonly localDBPassword: ssm.StringParameter | null = null;

  readonly environment;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const env = this.node.tryGetContext("env") ?? "dev";
    const config = this.node.tryGetContext(env);

    this.jwtSecret = new secretsmanager.Secret(this, "NovaOmsJwtSecret", {
      secretName: `novaoms/${env}/jwt`,
      description: `Nova Oms Jwt for ${env}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "JWT_SECRET",
        passwordLength: 32,
      },
    });

    const rotationLambda = NodeLambdaFactory.create(scope, "JwtRotationLambda", {
      entry: "src/lambdas/auth/rotation.ts",
      description: "JwtRotation Lambda Function",
      environment: {
        SECRET_NAME: this.jwtSecret.secretName,
      },
    });

    this.jwtSecret.addRotationSchedule("jwtRotation", {
      automaticallyAfter: cdk.Duration.days(15),
      rotationLambda,
    });

    this.jwtSecret.grantWrite(rotationLambda); 

    this.dbSecret = new secretsmanager.Secret(this, "NovaOmsDbSecret", {
      secretName: `novaoms/${env}/db`,
      description: `Nova Oms Jwt for ${env}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: config.DB_USER,
        }),
        generateStringKey: "password",
        passwordLength: 32,
      },
    });

    this.dbSecret.addRotationSchedule("dbRotation", {
      automaticallyAfter: cdk.Duration.days(30),
      hostedRotation: secretsmanager.HostedRotation.postgreSqlSingleUser(),
    });

    if(env==="local"){
      this.localDBUser = new ssm.StringParameter(this, "LocalDBUser", {
        parameterName: `/novaoms/${env}/db/user`,
        stringValue: config.DB_USER,
      });

      this.localDBPassword = new ssm.StringParameter(this, "LocalDBPassword", {
        parameterName: `/novaoms/${env}/db/password`,
        stringValue: config.DB_PASSWORD,
      });
    }
  
    this.dbNameParameter = new ssm.StringParameter(this, "DbName", {
      parameterName: `/novaoms/${env}/db/name`,
      stringValue: config.DB_NAME,
    });

    this.jwtAccessTokenExpiresParameter = new ssm.StringParameter(this, "JwtAccessTokenExpires", {
      parameterName: `/novaoms/${env}/jwt/access_expires`,
      stringValue: config.JWT_ACCESS_TOKEN_EXPIRES,
    });

    this.jwtExpirationTimeParameter = new ssm.StringParameter(this, "JwtExpirationTIme", {
      parameterName: `/novaoms/${env}/jwt/expiration_time`,
      stringValue: config.JWT_EXPIRATION_TIME,
    });

    this.jwtRefreshTokenDaysParameter = new ssm.StringParameter(this, "JwtRefreshTokenDays", {
      parameterName: `/novaoms/${env}/jwt/refresh_token_days`,
      stringValue: config.JWT_REFRESH_TOKEN_DAYS,
    });

    this.environment = {
      DB_USER: env === "local" ? this.localDBUser!.stringValue: this.dbSecret.secretValueFromJson("username").toString(),
      DB_PASSWORD: env === "local" ? this.localDBPassword!.stringValue: this.dbSecret.secretValueFromJson("password").toString(),
      DB_NAME: this.dbNameParameter.stringValue,

      AUTH_PROVIDER:config.AUTH_PROVIDER,
      LOGGER_PROVIDER: config.LOGGER_PROVIDER,
       
      JWT_SECRET: this.jwtSecret.secretValueFromJson("JWT_SECRET").toString(),
      JWT_ACCESS_TOKEN_EXPIRES: this.jwtAccessTokenExpiresParameter.stringValue,
      JWT_REFRESH_TOKEN_DAYS: this.jwtRefreshTokenDaysParameter.stringValue,

      JWT_EXPIRATION_TIME: this.jwtExpirationTimeParameter.stringValue, 

      ...(env === "local" && config.AWS_ENDPOINT_URL && { AWS_ENDPOINT_URL: config.AWS_ENDPOINT_URL })

    };
  }

  getLambdaEnv() {
    return this.environment;
  }

  setDbHostProperty(key:string, value:string, env:string){

    this.dbHostParameter = new ssm.StringParameter(this, "DbHost", {
      parameterName: `/novaoms/${env}/db/host`,
      stringValue: value,
    });

    this.environment[key]= value;
  }

  grantReadConfig(lambdaFunction: NodejsFunction) {
    this.dbSecret.grantRead(lambdaFunction);

    this.localDBUser?.grantRead(lambdaFunction);
    this.localDBPassword?.grantRead(lambdaFunction);


    this.dbNameParameter.grantRead(lambdaFunction);
    this.dbHostParameter?.grantRead(lambdaFunction);
    this.jwtSecret.grantRead(lambdaFunction);
    this.jwtAccessTokenExpiresParameter.grantRead(lambdaFunction);
    this.jwtRefreshTokenDaysParameter.grantRead(lambdaFunction);
  }
}
