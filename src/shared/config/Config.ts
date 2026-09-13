import { Environment } from "./Environment.js";

export class Config {
  readonly serviceName: string;
  readonly version: string;
  readonly environment: Environment;
  readonly awsRegion: string;
  readonly authProvider:string;
  readonly dbUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpirationTime:string;
  readonly accessTokenExpires: number;
  readonly refreshTokenDays: number;
  readonly loggerProvider: string | undefined;
  //
  readonly endpoint:string | undefined;

  //AWS Cognito
  readonly cognitoClientId: string;
  readonly cognitoUserPoolId: string;


  constructor() {
    // App
    this.serviceName = process.env.APP_NAME ?? "";
    this.version = process.env.APP_VERSION ?? "";
    this.environment = Environment.from(process.env.APP_ENV);
    this.awsRegion = process.env.AWS_REGION ?? "";
    this.loggerProvider = process.env.LOGGER_PROVIDER;
    // AUTH provider
    this.authProvider = process.env.AUTH_PROVIDER ?? "";
    //DB
    this.dbUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;  
    // LOCAL JWT
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtExpirationTime = process.env.JWT_EXPIRATION_TIME ?? "24";
    this.accessTokenExpires = Number (process.env.JWT_ACCESS_TOKEN_EXPIRES ?? 3600);
    this.refreshTokenDays = Number (process.env.JWT_REFRESH_TOKEN_DAYS ?? 30);
    //AWS Localstack
    this.endpoint = process.env.AWS_ENDPOINT_URL;

    // AWS Cognito
    this.cognitoClientId = process.env.AWS_COGNITO_CLIENT_ID!;
    this.cognitoUserPoolId = process.env.AWS_COGNITO_USER_POOL_ID!;

  }
}
