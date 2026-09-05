import { GetUserUseCase } from "@modules/users/application/use-cases/users/GetUserUseCase.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { IdSchema, IdRequestSchema } from "@shared/presentation/schemas/IdSchema.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { UsersPermissions } from "@shared/security/permissions/UserPermissions.js";


export class GetUserHandler extends Handler{
    readonly descriptor = {
        authenticated: true,
        permissions:[UsersPermissions.READ.name],
        request: IdSchema
    }
    constructor(private readonly getUserUseCase: GetUserUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<IdRequestSchema>()!;
        
        const response = await this.getUserUseCase.execute(request);
        return ApiResponse.ok(response);
    }

    
}
