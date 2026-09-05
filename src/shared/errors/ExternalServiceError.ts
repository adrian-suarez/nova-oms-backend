import { ApplicationError } from "./ApplicationError.js";

export class ExternalServiceError extends ApplicationError {
  constructor(code:string, message: string, cause?:unknown) {
    super(code, message, 502,cause);
  }
}
