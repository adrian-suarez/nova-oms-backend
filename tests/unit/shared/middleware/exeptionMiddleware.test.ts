import { Metrics } from "@aws-lambda-powertools/metrics";
import { ConflictError } from "@shared/errors/ConflictError.js";
import { ForbiddenError } from "@shared/errors/ForbiddenError.js";
import { NotFoundError } from "@shared/errors/NotFoundError.js";
import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";
import { Logger } from "@shared/logger/Logger.js";
import { exceptionMiddleware } from "@shared/middleware/exceptionMiddleware.js";
import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { mock } from "vitest-mock-extended";
import z from "zod";

describe("exceptionMiddleware",()=>{

    const event = {} as APIGatewayProxyEventV2;
    const context = {} as Context;
    const logger = mock<Logger>();
    const metrics = mock<Metrics>();

    it.each([
        [new UnauthorizedError("Unauthorized"), 401, "UNAUTHORIZED_ERROR"],
        [new ForbiddenError(), 403, "FORBIDDEN_ERROR"],
        [new NotFoundError("User"), 404, "NOT_FOUND_ERROR"],
        [new ConflictError("User already exists"), 409, "CONFLICT_ERROR"],
    ])("map %o to the http status and expected code", async(error, expectedStatus, expectedCode)=>{
        const wrapped = exceptionMiddleware(logger,metrics)(async ()=> {throw error;});

        const response = await wrapped(event, context);

        expect(response.statusCode).toBe(expectedStatus);
        expect(JSON.parse(response.body!).code).toBe(expectedCode);

    });

    it("map zodError to 400 with the issue details", async ()=>{
        const schema = z.object({email: z.email()});
        const wrapped = exceptionMiddleware(logger,metrics)( async () => {
            schema.parse({email:"invalid-email"});
            return {statusCode:200 , body:"{}"};
        });

        const response = await wrapped(event,context);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body!).code).toBe("VALIDATION_ERROR");
    });

    it("map any unhandled exception to 500 without exposing internal details", async ()=>{
        const wrapped = exceptionMiddleware(logger,metrics)( async () => {
            throw new Error("internal detail");
        });

        const response = await wrapped(event,context);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body!).code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("if there is no error then let the handler's response pass without touching it", async ()=>{
        const okResponse = {statusCode: 200 , body: "{}"};
        const wrapped = exceptionMiddleware(logger,metrics)( async () => okResponse);

        const response = await wrapped(event,context);

        expect(response).toBe(okResponse);
    });

});