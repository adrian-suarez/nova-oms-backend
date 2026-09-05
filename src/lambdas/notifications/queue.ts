import { sqsLambdaFactory } from "@bootstrap/Bootstrap.js";
import { notificationContainer } from "./bootstrap.js";

export const handler = sqsLambdaFactory.create(notificationContainer.getNotificationQueueConsumerHandler());