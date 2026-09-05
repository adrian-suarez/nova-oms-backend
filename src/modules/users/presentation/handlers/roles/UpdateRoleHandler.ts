import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { UpdateRoleRequestSchema, UpdateRoleSchema } from "../../schemas/roles/UpdateRoleSchema.js";
import { UpdateRoleUseCase } from "@modules/users/application/use-cases/roles/UpdateRoleUseCase.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { RolesPermissions } from "@shared/security/permissions/RolePermissions.js";


export class UpdateRoleHandler extends Handler{
    readonly descriptor = {
        request:UpdateRoleSchema,
        authenticated: true,
        permissions:[RolesPermissions.UPDATE.name],
        transaction: true,
    }
    
    constructor(private readonly updateRoleUseCase: UpdateRoleUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }

    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {

        const request = this.executionContextProvider.get()!.getRequest<UpdateRoleRequestSchema>()!;

        const response = await this.updateRoleUseCase.execute(request);

        return ApiResponse.ok(response);
    }
    
}