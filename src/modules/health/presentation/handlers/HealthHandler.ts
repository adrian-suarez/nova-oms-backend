import type { APIGatewayProxyEventV2, Context } from "aws-lambda";

import { ApiResponse } from "@shared/presentation/ApiResponse.js";

import { HealthUseCase } from "@modules/health/application/use-cases/HealthUseCase.js";
import { Handler } from "@shared/aws/lambda/Handler.js";


export class HealthHandler extends Handler{
  readonly descriptor = {
    authenticated: false,
  }

  constructor(private healthUseCase:HealthUseCase){
    super();
  }

  async handle(_event:APIGatewayProxyEventV2, _context:Context) {

    const response = this.healthUseCase.execute();
    return ApiResponse.ok(response);
  }

}

