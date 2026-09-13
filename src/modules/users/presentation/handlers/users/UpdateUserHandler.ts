import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { UpdateUserRequestSchema, UpdateUserSchema } from "../../schemas/users/UpdateUserSchema.js";
import { UpdateUserUseCase } from "@modules/users/application/use-cases/users/UpdateUserUseCase.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { UsersPermissions } from "@shared/security/permissions/UserPermissions.js";


export class UpdateUserHandler extends Handler{
    readonly descriptor = {
        request:UpdateUserSchema,
        authenticated: true,
        permissions:[UsersPermissions.UPDATE.name],
    }
    
    constructor(private readonly updateUserUseCase: UpdateUserUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }

    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {

        const request = this.executionContextProvider.get()!.getRequest<UpdateUserRequestSchema>()!;

        const response = await this.updateUserUseCase.execute(request);

        return ApiResponse.ok(response);
    }
    
}