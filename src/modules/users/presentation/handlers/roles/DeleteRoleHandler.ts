import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { DeleteRoleUseCase } from "@modules/users/application/use-cases/roles/DeleteRoleUseCase.js";
import { IdSchema, IdRequestSchema } from "@shared/presentation/schemas/IdSchema.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { RolesPermissions } from "@shared/security/permissions/RolePermissions.js";


export class DeleteRoleHandler extends Handler{
    readonly descriptor = {
        authenticated: true,
        permissions:[RolesPermissions.DELETE.name],
        request: IdSchema
    }
    constructor(private readonly deleteRoleUseCase: DeleteRoleUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<IdRequestSchema>()!;
        
        const response = await this.deleteRoleUseCase.execute(request);
        return ApiResponse.ok(response);
    }

    
}
