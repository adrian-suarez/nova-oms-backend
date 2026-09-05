import { sqsLambdaFactory } from "@bootstrap/Bootstrap.js";
import { userContainer } from "./bootstrap.js";


export const handler = sqsLambdaFactory.create(userContainer.getUserQueueConsumerHandler());