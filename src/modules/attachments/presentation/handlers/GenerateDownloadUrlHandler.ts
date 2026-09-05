import { GenerateDownloadUrlUseCase } from "@modules/attachments/application/use-cases/GenerateDownloadUrlUseCase.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { IdRequestSchema, IdSchema } from "@shared/presentation/schemas/IdSchema.js";
import { AttachmentsPermissions } from "@shared/security/permissions/AttachmentPermissions.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";


export class GenerateDownloadUrlHandler extends Handler{
    readonly descriptor = {
        authenticated: true,
        permissions:[AttachmentsPermissions.DOWNLOAD.name],
        request: IdSchema
    }
    constructor(private readonly generateDownloadUrlUseCase: GenerateDownloadUrlUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<IdRequestSchema>()!;
        const response = await this.generateDownloadUrlUseCase.execute(request);
        return ApiResponse.ok(response);
    }

}