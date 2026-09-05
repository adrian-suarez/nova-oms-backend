import { PipelineBehavior, PipelineNext } from "../PipelineBehavior.js";
import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";
import { AuthenticationProvider } from "@modules/auth/application/providers/AuthenticationProvider.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { IdentityRepository } from "@modules/auth/domain/repositories/IdentityRepository.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";



export class AuthenticationBehavior implements PipelineBehavior<APIGatewayProxyEventV2,
        APIGatewayProxyStructuredResultV2>{

    constructor(private readonly identityProvider:AuthenticationProvider,
        private readonly identityRepository:IdentityRepository,
        private readonly executionContextProvider: ExecutionContextProvider 
    ){}

    async handle(descriptor: HandlerDescriptor,event: APIGatewayProxyEventV2, context: Context, next: PipelineNext<APIGatewayProxyStructuredResultV2>): Promise<APIGatewayProxyStructuredResultV2> {
        
        const request = this.executionContextProvider.get();

        const auth = event.headers?.["Authorization"];
        
        if(auth == null || auth == undefined || !auth.startsWith("Bearer ")){
            throw new UnauthorizedError("Unauthorized");
        }

        const token = auth.replace("Bearer ","");
        const authUser = await this.identityProvider!.authenticate(token);
        const user = await this.identityRepository.load(authUser);

        request!.setUser(user);

        return next();

    }
    
}