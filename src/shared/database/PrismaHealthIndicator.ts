import { HealthService } from "@modules/health/domain/services/HealthService.js";
import { PrismaProvider } from "./PrismaProvider.js";
import { Logger } from "@shared/logger/Logger.js";


export class PrismaHealthIndicator implements HealthService{
    constructor(private readonly provider: PrismaProvider, private readonly logger:Logger){}

    async isHealthy(){
        try{
            await this.provider.getClient().$queryRaw`SELECT 1`;
            return true;
        }catch(error){
            this.logger.error("DB Error",{error});
            return false
        }
    }
}