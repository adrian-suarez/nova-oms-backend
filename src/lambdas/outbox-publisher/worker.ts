import { scheduleLambdaFactory, sharedContainer } from "@bootstrap/Bootstrap.js";
import { eventWorkerSharedContainer } from "./bootstrap.js";
import { OutboxWorkerHandler } from "@shared/presentation/handlers/OutboxWorkerHandler.js";

const outboxWorkerHandler= new OutboxWorkerHandler(eventWorkerSharedContainer.outboxPublisherWorker, sharedContainer.logger);

export const handler = scheduleLambdaFactory.create(outboxWorkerHandler);
