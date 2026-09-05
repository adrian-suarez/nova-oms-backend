import { LoginUseCase } from "@modules/auth/application/use-cases/LoginUseCase.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { LoginRequestSchema, LoginSchema } from "../schemas/AuthSchema.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";



export class LoginHandler implements Handler{

    readonly descriptor = {
        request:LoginSchema,
    }

    constructor(private loginUseCase:LoginUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
     ){}
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()!.getRequest<LoginRequestSchema>()!;
        const response = await this.loginUseCase.execute(request);
        
        return ApiResponse.ok(response);
    }
    
}