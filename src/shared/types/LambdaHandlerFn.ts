import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";


export type LambdaHandlerFn = (event: APIGatewayProxyEventV2,context: Context) => Promise<APIGatewayProxyStructuredResultV2>;