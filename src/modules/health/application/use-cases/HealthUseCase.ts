import { Config } from "@shared/config/Config.js";
import { HealthResponse } from "../dto/HealthResponse.js";
import { UseCase } from "@shared/application/use-cases/UseCase.js";
import { HealthService } from "@modules/health/domain/services/HealthService.js";

export class HealthUseCase implements UseCase<void,HealthResponse>{

  constructor(private config: Config, private dbHealthService: HealthService){}

  async execute(): Promise<HealthResponse> {
    return {
      status: "UP",
      application: this.config.serviceName,
      version: this.config.version,
      environment: this.config.environment,
      node: process.version,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        api: "UP",
        lambda: "UP",
        db: await this.dbHealthService.isHealthy()?"UP":"DOWN"
      },
    };
  }
}
