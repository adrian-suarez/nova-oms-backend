
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { GetRolesSchema } from "../../schemas/roles/GetRolesSchema.js";
import { GetRolesRequest } from "@modules/users/application/dto/requests/roles/GetRolesRequest.js";
import { GetRolesUseCase } from "@modules/users/application/use-cases/roles/GetRolesUseCase.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { RolesPermissions } from "@shared/security/permissions/RolePermissions.js";

export class GetRolesHandler extends Handler {
    readonly descriptor = {
        authenticated: true,
        permissions: [RolesPermissions.READ.name],
        request:GetRolesSchema
    };
    constructor(private readonly getRolesUseCase: GetRolesUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ) {
        super();
    }
    async handle(_event: APIGatewayProxyEventV2,_context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<GetRolesRequest>()!;
        const response = await this.getRolesUseCase.execute(request);
        return ApiResponse.ok(response);
    }
}
