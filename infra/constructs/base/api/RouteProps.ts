import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";


export interface RouteProps {
    name:string;
    methods: HttpMethod[];
    path: string;
    lambda: NodejsFunction;
    version?:string;
}