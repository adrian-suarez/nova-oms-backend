import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { CreateRoleRequestSchema, CreateRoleSchema } from "../../schemas/roles/CreateRoleSchema.js";
import { CreateRoleUseCase } from "@modules/users/application/use-cases/roles/CreateRoleUseCase.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { RolesPermissions } from "@shared/security/permissions/RolePermissions.js";



export class CreateRoleHandler extends Handler{
    readonly descriptor = {
        request:CreateRoleSchema,
        authenticated: true,
        permissions:[RolesPermissions.CREATE.name],
        transaction: true,
        idempotent:true
    }
    
    constructor(private readonly createRoleUseCase: CreateRoleUseCase,
        private readonly executionContextProvider: ExecutionContextProvider){
        super();
    }

    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {

        const request = this.executionContextProvider.get()!.getRequest<CreateRoleRequestSchema>()!;

        const response = await this.createRoleUseCase.execute(request);

        return ApiResponse.ok(response);
    }
    
}