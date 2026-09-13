import { RequestValidationBehavior } from "@shared/application/pipelines/behaviors/RequestValidationBehavior.js";
import { HandlerDescriptor } from "@shared/aws/lambda/HandlerDescriptor.js";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import z, { ZodError } from "zod";
import { makeExecutionContextProvider } from "../../../../support/executionContext.js";


describe("RequestValidationBehavior",()=>{
    const nextResult = {statusCode: 200, body: "{}"};
    const schema =  z.object({email: z.email()});

    it("let it pass if there is no declared schema", async()=>{
        const { executionContextProvider} = makeExecutionContextProvider();
        const behavior = new RequestValidationBehavior(executionContextProvider);
        
        await expect(behavior.handle({},
            {} as APIGatewayProxyEventV2,
            {} as Context,
            async ()=> nextResult)
        ).resolves.toBe(nextResult);
    });

    it("parse the body and it save it in executionContext",async()=>{
        const { executionContextProvider,context} = makeExecutionContextProvider();
        const behavior = new RequestValidationBehavior(executionContextProvider);
        const descriptor: HandlerDescriptor = {request:schema};
        const event = {body:JSON.stringify({email:"user@novaoms.com"})} as unknown as APIGatewayProxyEventV2;
        
        await behavior.handle(descriptor,
            event,
            {} as Context,
            async ()=> nextResult
        );

        expect(context.getRequest<{email:string}>().email).toBe("user@novaoms.com");
    });

    it("throw zodError if the body doesn't match the schema",()=>{
        const { executionContextProvider} = makeExecutionContextProvider();
        const behavior = new RequestValidationBehavior(executionContextProvider);
        const descriptor: HandlerDescriptor = {request:schema};
        const event = {body:JSON.stringify({email:"invalid-email"})} as unknown as APIGatewayProxyEventV2;
        
        expect(()=>behavior.handle(descriptor,
            event,
            {} as Context,
            async ()=> nextResult
        )).toThrow(ZodError);
    });
});