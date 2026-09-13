import { lambdaFactory } from "@bootstrap/Bootstrap.js";
import { attachmentContainer } from "./bootstrap.js";


export const handler = lambdaFactory.create(attachmentContainer.getGetAttachmentHandler());