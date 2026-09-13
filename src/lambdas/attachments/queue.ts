import { sqsLambdaFactory } from "@bootstrap/Bootstrap.js";
import { attachmentContainer } from "./bootstrap.js";


export const handler = sqsLambdaFactory.create(attachmentContainer.getUploadQueueConsumerHandler());