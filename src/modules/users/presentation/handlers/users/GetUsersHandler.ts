import { GetUsersRequest } from "@modules/users/application/dto/requests/users/GetUsersRequest.js";
import { GetUsersUseCase } from "@modules/users/application/use-cases/users/GetUsersUseCase.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { GetUsersSchema } from "../../schemas/users/GetUsersSchema.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { UsersPermissions } from "@shared/security/permissions/UserPermissions.js";

export class GetUsersHandler extends Handler {
    readonly descriptor = {
        authenticated: true,
        permissions: [UsersPermissions.READ.name],
        request:GetUsersSchema
    };
    constructor(private readonly getUsersUseCase: GetUsersUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ) {
        super();
    }
    async handle(_event: APIGatewayProxyEventV2,_context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<GetUsersRequest>()!;
        const response = await this.getUsersUseCase.execute(request);
        return ApiResponse.ok(response);
    }
}
