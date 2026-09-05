import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { IdSchema, IdRequestSchema } from "@shared/presentation/schemas/IdSchema.js";
import { GetRoleUseCase } from "@modules/users/application/use-cases/roles/GetRoleUseCase.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { RolesPermissions } from "@shared/security/permissions/RolePermissions.js";


export class GetRoleHandler extends Handler{
    readonly descriptor = {
        authenticated: true,
        permissions:[RolesPermissions.READ.name],
        request: IdSchema
    }
    constructor(private readonly getRoleUseCase: GetRoleUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<IdRequestSchema>()!;
        
        const response = await this.getRoleUseCase.execute(request);
        return ApiResponse.ok(response);
    }

    
}
