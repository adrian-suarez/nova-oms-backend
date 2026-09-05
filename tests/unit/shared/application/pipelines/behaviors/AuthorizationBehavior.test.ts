import { AuthenticatedUser } from "@modules/auth/domain/entities/AuthUser.js";
import { AuthorizationBehavior } from "@shared/application/pipelines/behaviors/AuthorizationBehavior.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { ForbiddenError } from "@shared/errors/ForbiddenError.js";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { makeExecutionContextProvider } from "../../../../support/executionContext.js";


function makeBehaviorWithPermissions(permissions:string []){
    const {executionContextProvider, context} = makeExecutionContextProvider();
    context.setUser(new AuthenticatedUser(
        "user-1",
        "user@novaoms.com",
        "Test",
        "User",
        [],
        permissions.map(name => ({id:name, name}))
    ));

    return new AuthorizationBehavior(executionContextProvider);
}

describe("AuthorizationBehavior",()=>{

    const event = {} as APIGatewayProxyEventV2;
    const nextResult = {statusCode: 200, body: "{}"};

    it("let pass if the route don't declare permissions", async()=>{
        const behavior = makeBehaviorWithPermissions([]);
        
        await expect(behavior.handle({},
            event,
            {} as Context,
            async ()=> nextResult)
        ).resolves.toBe(nextResult);
    });

    it("let pass if the user has all the permissions required",async()=>{
        const behavior = makeBehaviorWithPermissions(["users.create","users.read"]);
        const descriptor: HandlerDescriptor = {permissions:["users.create"]};

        await expect(behavior.handle(descriptor,
            event,
            {} as Context,
            async ()=> nextResult)
        ).resolves.toBe(nextResult);
    });

    it("reject with forbiddenError if missing some permission", ()=>{
        const behavior = makeBehaviorWithPermissions(["users.read"]);
        const descriptor: HandlerDescriptor = {permissions:["users.create","users.read"]};

        expect(()=> behavior.handle(descriptor,
            event,
            {} as Context,
            async ()=> nextResult)
        ).toThrow(ForbiddenError);
    });
});