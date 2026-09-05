import { ApplicationError } from "@shared/errors/ApplicationError.js";
import { Logger } from "@shared/logger/Logger.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { Middleware } from "./middleware.js";
import { ZodError } from "zod";
import { Metrics } from "@aws-lambda-powertools/metrics";


export function exceptionMiddleware(logger:Logger, metrics:Metrics): Middleware {

    return next => {
        return async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
            try {
                return await next(event, context);
            } catch (error) {
                if (error instanceof ApplicationError) {
                    logger?.error("ApplicationError", {error});
                    return ApiResponse.error(error.statusCode, error.code, error.message);
                } else if (error instanceof ZodError) {
                    logger?.error("ValidationError", {error});
                    const messages = error.issues.map(e => `${e.path.join(".")}: ${e.message}`); 
                    return ApiResponse.error(400, "VALIDATION_ERROR","VALIDATION_ERROR",messages);
                }
                logger?.error("Unhandled exception", {error});

                return ApiResponse.error(500, "INTERNAL_SERVER_ERROR", "Unexpected error");
            }finally{
                metrics.publishStoredMetrics();
            }
        }
    }
}