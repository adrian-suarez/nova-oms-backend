import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpApiConstruct } from "../constructs/base/api/HttpApiConstruct.js";
import { HealthConstruct } from "../constructs/modules/health/HealthConstruct.js";


export function registerHealthRoutes(healthConstruct: HealthConstruct, api: HttpApiConstruct) {
  api.addRoute({
    name: "HealthIntegration",
    path: "/health",
    methods: [HttpMethod.GET],
    lambda: healthConstruct.lambdaFunction,
  });
}
