import { CfnOutput } from "aws-cdk-lib";
import { CorsHttpMethod, HttpApi, HttpStage } from "aws-cdk-lib/aws-apigatewayv2";
import { Construct } from "constructs";
import { RouteProps } from "./RouteProps.js";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpApiProps } from "./HttpApiProps.js";


export class HttpApiConstruct extends Construct{
    readonly httpApi:HttpApi;

    constructor(scope: Construct, id:string, props:HttpApiProps){
        super(scope,id);

        this.httpApi = new HttpApi(this,"NovaOmsApi",{
            apiName:props.apiName,
            corsPreflight:{
                allowHeaders:["*"],
                allowMethods:[CorsHttpMethod.ANY],
                allowOrigins:props.allowedOrigins
            },
            createDefaultStage:true,
        });

        new HttpStage(this,`${props.env}Stage`,{
            httpApi: this.httpApi,
            stageName:props.env,
            autoDeploy:true,
            throttle:{
                rateLimit: 50,
                burstLimit: 100
            }
        });

        new CfnOutput(this, "HttpApiUrl",{
            value: this.httpApi.apiEndpoint
        });
    }

    public addRoute(props:RouteProps){
        const version = props.version ?? "/v1";
        this.httpApi.addRoutes({
            path: `${version}${props.path}`,
            methods:props.methods,
            integration: new HttpLambdaIntegration(props.name,props.lambda)
        });
    }
}