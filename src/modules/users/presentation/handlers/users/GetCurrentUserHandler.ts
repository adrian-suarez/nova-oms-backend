import { GetUserUseCase } from "@modules/users/application/use-cases/users/GetUserUseCase.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, Context, APIGatewayProxyStructuredResultV2 } from "aws-lambda";


export class GetCurrentUserHandler extends Handler{
    readonly descriptor = {
        authenticated: true,
    }
    constructor(private readonly getUserUseCase: GetUserUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        return ApiResponse.ok(this.executionContextProvider.get()!.getUser());
    }

    
}
