import { ApplicationError } from "./ApplicationError.js";

export class UnauthorizedError extends ApplicationError {
  constructor(message: string) {
    super("UNAUTHORIZED_ERROR", message, 401);
  }
}
