import { Config } from "@shared/config/Config.js";
import { HealthUseCase } from "@modules/health/application/use-cases/HealthUseCase.js";
import { PrismaClientFactory } from "@shared/database/PrismaClientFactory.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { PrismaHealthIndicator } from "@shared/database/PrismaHealthIndicator.js";
import { AsyncLocalExecutionContextProvider } from "@shared/infrastructure/context/AsyncLocalExecutionContextProvider.js";
import { ConsoleLogger } from "@shared/logger/ConsoleLogger.js";
import { ExecutionContext } from "@shared/application/context/ExecutionContext.js";


describe("HealthUseCase",()=>{
    const config = new Config();
    const executionContextProvider = new AsyncLocalExecutionContextProvider()

    const prisma = PrismaClientFactory.getClient(config);
    const provider = new PrismaProvider(prisma,executionContextProvider);
    const logger = new ConsoleLogger(executionContextProvider);
    const indicator =new PrismaHealthIndicator(provider,logger);
    const useCase = new HealthUseCase(new Config(), indicator);

    it("should return status UP",async ()=>{

        await executionContextProvider.run( new ExecutionContext({},"req-1","corr-1","IntegrationTest"),
            async ()=>{
                const response = await useCase.execute();

                expect(response.status).toBe("UP");
                expect(response.services.db).toBe("UP");
            
        });
    });
});