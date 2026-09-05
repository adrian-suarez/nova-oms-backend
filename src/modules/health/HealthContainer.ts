import { HttpHandler } from "@shared/aws/lambda/Handler.js";
import { HealthUseCase } from "./application/use-cases/HealthUseCase.js";
import { HealthHandler } from "./presentation/handlers/HealthHandler.js";
import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";
import { PrismaHealthIndicator } from "@shared/database/PrismaHealthIndicator.js";


export class HealthContainer{
    private readonly handler;
    constructor(container:SharedContainer){
        const healthUseCase = new HealthUseCase(container.config, new PrismaHealthIndicator(container.prismaProvider,container.logger));
        this.handler = new HealthHandler(healthUseCase);
    }
    getHandler():HttpHandler{
        return this.handler;
    }
}