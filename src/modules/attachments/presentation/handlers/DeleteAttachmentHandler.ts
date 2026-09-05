import { DeleteAttachmentUseCase } from "@modules/attachments/application/use-cases/DeleteAttachmentUseCase.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { IdRequestSchema, IdSchema } from "@shared/presentation/schemas/IdSchema.js";
import { AttachmentsPermissions } from "@shared/security/permissions/AttachmentPermissions.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";


export class DeleteAttachmentHandler extends Handler{
    readonly descriptor = {
        authenticated: true,
        permissions:[AttachmentsPermissions.DELETE.name],
        request: IdSchema
    }
    constructor(private readonly deleteAttachmentUseCase: DeleteAttachmentUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<IdRequestSchema>()!;
        
        const response = await this.deleteAttachmentUseCase.execute(request);
        return ApiResponse.ok(response);
    }

    
}
