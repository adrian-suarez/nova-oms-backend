import { Config } from "@shared/config/Config.js";
import { HealthUseCase } from "@modules/health/application/use-cases/HealthUseCase.js";
import { HealthService } from "@modules/health/domain/services/HealthService.js";

class FakeHealthIndicator implements HealthService{
    constructor(){}

    async isHealthy(){
        return true;
    }
}

describe("HealthUseCase",()=>{
    it("should return status UP",async ()=>{
        const useCase = new HealthUseCase(new Config(), new FakeHealthIndicator());
        const response = await useCase.execute();

        expect(response.status).toBe("UP");
        expect(response.services.db).toBe("UP");

    });
});