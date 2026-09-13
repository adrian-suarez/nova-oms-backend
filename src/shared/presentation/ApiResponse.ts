import { ApiErrorResponseBody, ApiResponseBody } from "../application/dto/ApiResponseBody.js";

export class ApiResponse {
  private static json<T>(statusCode: number, body: T) {
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
  }

  static ok<T>(data: T) {
    return this.json<ApiResponseBody<T>>(200, {data});
  }

  static created<T>(data: T) {
    return this.json(201, data);
  }
  static noContent() {
    return { statusCode: 204 };
  }
  static error(status:number, code:string, message:string,errors?:unknown) {
    return this.json<ApiErrorResponseBody>(status, {code, message, details:errors});

  }
  
}
