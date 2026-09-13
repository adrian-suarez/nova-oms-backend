import { GenerateUploadUrlUseCase } from "@modules/attachments/application/use-cases/GenerateUploadUrlUseCase.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { GenerateUploadUrlRequestSchema, GenerateUploadUrlSchema } from "../schemas/GenerateUploadUrlSchema.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { AttachmentsPermissions } from "@shared/security/permissions/AttachmentPermissions.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";


export class GenerateUploadUrlHandler extends Handler{
    readonly descriptor = {
        authenticated: true,
        permissions:[AttachmentsPermissions.UPLOAD.name],
        request: GenerateUploadUrlSchema
    }
    constructor(private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<GenerateUploadUrlRequestSchema>()!;
        const user = this.executionContextProvider.get()?.getUser()!;
        const response = await this.generateUploadUrlUseCase.execute({...request, ownerUserId:user.id, ownerUserEmail:user.email});
        return ApiResponse.ok(response);
    }

}