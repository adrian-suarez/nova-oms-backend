import { GetAttachmentsRequest } from "@modules/attachments/application/dto/request/GetAttachmentsRequest.js";
import { GetAttachmentsUseCase } from "@modules/attachments/application/use-cases/GetAttachmentsUseCase.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { AttachmentsPermissions } from "@shared/security/permissions/AttachmentPermissions.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { GetAttachmentsSchema } from "../schemas/GetAttachmentsSchema.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";

export class GetAttachmentsHandler extends Handler {
    readonly descriptor = {
        authenticated: true,
        permissions: [AttachmentsPermissions.READ.name],
        request:GetAttachmentsSchema
    };
    constructor(private readonly getAttachmentsUseCase: GetAttachmentsUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ) {
        super();
    }
    async handle(_event: APIGatewayProxyEventV2,_context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<GetAttachmentsRequest>()!;
        const response = await this.getAttachmentsUseCase.execute(request);
        return ApiResponse.ok(response);
    }
}
