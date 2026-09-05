import { HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpApiConstruct } from "../constructs/base/api/HttpApiConstruct.js";
import { AttachmentsConstruct } from "../constructs/modules/attachments/AttachmentsConstruct.js";

export function registerAttachmentRoutes(userConstruct: AttachmentsConstruct, api: HttpApiConstruct) {

  api.addRoute({
    name: "GenerateUploadUrlIntegration",
    path: "/attachments/upload",
    methods: [HttpMethod.POST],
    lambda: userConstruct.generateUploadUrlLambdaFunction,
  });

  api.addRoute({
    name: "GenerateDownloadUrlIntegration",
    path: "/attachments/{id}/download",
    methods: [HttpMethod.GET],
    lambda: userConstruct.generateDownloadUrlLambdaFunction,
  });

  api.addRoute({
    name: "GetAttachmentIntegration",
    path: "/attachments/{id}",
    methods: [HttpMethod.GET],
    lambda: userConstruct.getAttachmentLambdaFunction,
  });

  api.addRoute({
    name: "GetAttachmentsIntegration",
    path: "/attachments",
    methods: [HttpMethod.GET],
    lambda: userConstruct.getAttachmentsLambdaFunction,
  });

  api.addRoute({
    name: "DeleteAttachmentIntegration",
    path: "/attachments/{id}",
    methods: [HttpMethod.DELETE],
    lambda: userConstruct.deleteAttachmentLambdaFunction,
  });

}
