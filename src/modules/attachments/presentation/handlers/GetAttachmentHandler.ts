import { GetAttachmentUseCase } from "@modules/attachments/application/use-cases/GetAttachmentUseCase.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { Handler } from "@shared/aws/lambda/Handler.js";
import { ApiResponse } from "@shared/presentation/ApiResponse.js";
import { IdRequestSchema, IdSchema } from "@shared/presentation/schemas/IdSchema.js";
import { AttachmentsPermissions } from "@shared/security/permissions/AttachmentPermissions.js";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";


export class GetAttachmentHandler extends Handler{
    readonly descriptor = {
        authenticated: true,
        permissions:[AttachmentsPermissions.READ.name],
        request: IdSchema
    }
    constructor(private readonly getAttachmentUseCase: GetAttachmentUseCase,
        private readonly executionContextProvider: ExecutionContextProvider
    ){
        super();
    }
    async handle(_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> {
        const request = this.executionContextProvider.get()?.getRequest<IdRequestSchema>()!;
        
        const response = await this.getAttachmentUseCase.execute(request);
        return ApiResponse.ok(response);
    }

    
}
