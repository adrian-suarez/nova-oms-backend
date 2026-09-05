import { CreateUserUseCase } from "@modules/users/application/use-cases/users/CreateUserUseCase.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { CreateUserRequestSchema, CreateUserSchema } from "../../schemas/users/CreateUserSchema.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { UsersPermissions } from "@shared/security/permissions/UserPermissions.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";



export class CreateUserHandler extends Handler{
    readonly descriptor:HandlerDescriptor = {
        request:CreateUserSchema,
        authenticated: true,
        permissions:[UsersPermissions.CREATE.name],
        idempotent:true
    }
    
    constructor(private readonly createUserUseCase: CreateUserUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }

    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {

        const request = this.executionContextProvider.get()!.getRequest<CreateUserRequestSchema>()!;

        const response = await this.createUserUseCase.execute(request);

        return ApiResponse.ok(response);
    }
    
}