import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { UsersConstruct } from "../constructs/modules/users/UsersConstruct.js";
import { HttpApiConstruct } from "../constructs/base/api/HttpApiConstruct.js";

export function registerUsersRoutes(userConstruct: UsersConstruct, api: HttpApiConstruct) {

  api.addRoute({
    name: "GetCurrentUserIntegration",
    path: "/users/me",
    methods: [HttpMethod.GET],
    lambda: userConstruct.getCurrentUserLambdaFunction,
  });

  api.addRoute({
    name: "GetUserIntegration",
    path: "/users/{id}",
    methods: [HttpMethod.GET],
    lambda: userConstruct.getUserLambdaFunction,
  });
  api.addRoute({
    name: "GetUsersIntegration",
    path: "/users",
    methods: [HttpMethod.GET],
    lambda: userConstruct.getUsersLambdaFunction,
  });
  api.addRoute({
    name: "CreateUserIntegration",
    path: "/users",
    methods: [HttpMethod.POST],
    lambda: userConstruct.createUserLambdaFunction,
  });

  api.addRoute({
    name: "PatchUserIntegration",
    path: "/users/{id}",
    methods: [HttpMethod.PATCH],
    lambda: userConstruct.updateUserLambdaFunction,
  });

  api.addRoute({
    name: "DeleteUserIntegration",
    path: "/users/{id}",
    methods: [HttpMethod.DELETE],
    lambda: userConstruct.deleteUserLambdaFunction,
  });
}
