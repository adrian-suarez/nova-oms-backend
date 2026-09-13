import { ApplicationError } from "./ApplicationError.js";

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
  }
}
