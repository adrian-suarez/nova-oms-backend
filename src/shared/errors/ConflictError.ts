import { ApplicationError } from "./ApplicationError.js";

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super("CONFLICT_ERROR", message, 409);
  }
}
