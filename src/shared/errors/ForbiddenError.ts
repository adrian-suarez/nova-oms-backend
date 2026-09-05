import { ApplicationError } from "./ApplicationError.js";

export class ForbiddenError extends ApplicationError {
  constructor() {
    super("FORBIDDEN_ERROR", "FORBIDDEN_ERROR", 403);
  }
}
