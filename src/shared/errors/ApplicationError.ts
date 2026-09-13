export abstract class ApplicationError extends Error {

  protected constructor(readonly code: string, message: string, readonly statusCode: number, readonly cause?:unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
