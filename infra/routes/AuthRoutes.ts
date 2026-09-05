import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpApiConstruct } from "../constructs/base/api/HttpApiConstruct.js";
import { AuthConstruct } from "../constructs/modules/auth/AuthConstruct.js";


export function registerAuthRoutes(authConstruct: AuthConstruct, api: HttpApiConstruct) {
  api.addRoute({
    name: "AuthLoginIntegration",
    path: "/auth/login",
    methods: [HttpMethod.POST],
    lambda: authConstruct.lambdaFunction,
  });
}
