import { ApplicationError } from "./ApplicationError.js";

export class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super("NOT_FOUND_ERROR", `${resource} not found`, 404);
  }
}
