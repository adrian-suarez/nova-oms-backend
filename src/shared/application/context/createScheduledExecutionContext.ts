import { ExecutionContext } from "./ExecutionContext.js";
import { randomUUID } from "node:crypto";

export function createScheduledExecutionContext(handlerName: string): ExecutionContext {
  const requestId = randomUUID();

  return new ExecutionContext(undefined, requestId, requestId, handlerName);
}
