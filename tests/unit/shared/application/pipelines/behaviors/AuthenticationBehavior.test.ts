import { AuthenticationProvider } from "@modules/auth/application/providers/AuthenticationProvider.js";
import { IdentityRepository } from "@modules/auth/domain/repositories/IdentityRepository.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { mock } from "vitest-mock-extended";
import { makeExecutionContextProvider } from "../../../../support/executionContext.js";
import { AuthenticationBehavior } from "@shared/application/pipelines/behaviors/AuthenticationBehavior.js";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";
import { AuthenticatedUser } from "@modules/auth/domain/entities/AuthUser.js";


describe("AuthenticationBehavior",()=>{

    const descriptor:HandlerDescriptor = {authenticated: true};
    const nextResult = {statusCode: 200, body: "{}"};

    function makeBehavior(){
        const authenticationProvider = mock<AuthenticationProvider>();
        const identityRepository = mock<IdentityRepository>();
        const {executionContextProvider, context} = makeExecutionContextProvider();

        return {
            behavior : new AuthenticationBehavior(authenticationProvider,identityRepository,executionContextProvider),
            authenticationProvider,
            identityRepository,
            context
        }
    }

    it("reject if there is not authorization header", async()=>{
        const {behavior} = makeBehavior();
        const event = {headers:{}} as APIGatewayProxyEventV2;

        await expect(behavior.handle(descriptor,
            event,
            {} as Context,
            async ()=> nextResult)
        ).rejects.toThrow(UnauthorizedError);
    });

    it("reject if authenticationProvider rejects the token",async()=>{
       const {behavior, authenticationProvider} = makeBehavior();
        authenticationProvider.authenticate.mockRejectedValue(new UnauthorizedError("Invalid Token"));
        const event = {headers:{authorization:"Bearer invalid-token"}} as unknown as APIGatewayProxyEventV2;

        await expect(behavior.handle(descriptor,
            event,
            {} as Context,
            async ()=> nextResult)
        ).rejects.toThrow(UnauthorizedError);
    });

    it("with a valid token, load the user in the executionContext and continue with the pipeline", async()=>{
        const {behavior, authenticationProvider, identityRepository, context} = makeBehavior();

        authenticationProvider.authenticate.mockResolvedValue({sub:"user-1",email:"user@novaoms.com"});
        identityRepository.load.mockResolvedValue(
            new AuthenticatedUser("user-1","user@novaoms.com","Test", "User",[],[])
        );

        const event = { headers: {authorization:"Bearer valid-token"}} as unknown as APIGatewayProxyEventV2;
        const next = vi.fn().mockResolvedValue(nextResult);

        const result = await behavior.handle(descriptor, event,{} as Context, next);

        expect(result).toBe(nextResult);
        expect(next).toHaveBeenCalledOnce();
        expect(context.getUser()?.id).toBe("user-1");
    });
});