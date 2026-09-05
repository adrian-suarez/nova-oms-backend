import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { RolesConstruct } from "../constructs/modules/users/RolesConstruct.js";
import { HttpApiConstruct } from "../constructs/base/api/HttpApiConstruct.js";

export function registerRolesRoutes(roleConstruct: RolesConstruct, api: HttpApiConstruct) {

  api.addRoute({
    name: "GetRoleIntegration",
    path: "/roles/{id}",
    methods: [HttpMethod.GET],
    lambda: roleConstruct.getRoleLambdaFunction,
  });
  api.addRoute({
    name: "GetRolesIntegration",
    path: "/roles",
    methods: [HttpMethod.GET],
    lambda: roleConstruct.getRolesLambdaFunction,
  });
  api.addRoute({
    name: "CreateRoleIntegration",
    path: "/roles",
    methods: [HttpMethod.POST],
    lambda: roleConstruct.createRoleLambdaFunction,
  });

  api.addRoute({
    name: "PatchRoleIntegration",
    path: "/roles/{id}",
    methods: [HttpMethod.PATCH],
    lambda: roleConstruct.updateRoleLambdaFunction,
  });

  api.addRoute({
    name: "DeleteRoleIntegration",
    path: "/roles/{id}",
    methods: [HttpMethod.DELETE],
    lambda: roleConstruct.deleteRoleLambdaFunction,
  });
}
