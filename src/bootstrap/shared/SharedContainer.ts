import { Config } from "@shared/config/Config.js";
import { PrismaClientFactory } from "@shared/database/PrismaClientFactory.js";
import { ConsoleLogger } from "@shared/logger/ConsoleLogger.js";
import { PrismaProvider } from "@shared/database/PrismaProvider.js";
import { JwtService } from "@shared/security/jwt/JwtService.js";
import { BcryptPasswordHasher } from "@shared/security/hash/BcryptPasswordHasher.js";
import { JoseJwtServiceImpl } from "@shared/security/jwt/JoseJwtServiceImpl.js";
import { PrismaUnitOfWork } from "@shared/database/PrismaUnitOfWorkImpl.js";
import { BcryptRefreshTokenServiceImpl } from "@shared/security/refresh/BcryptRefreshTokenServiceImpl.js";
import { AsyncLocalExecutionContextProvider } from "@shared/infrastructure/context/AsyncLocalExecutionContextProvider.js";
import { PowertoolsLogger } from "@shared/logger/PowertoolsLogger.js";
import { Metrics } from "@aws-lambda-powertools/metrics";


export class SharedContainer {

    readonly config;
    readonly logger;
    readonly prisma;
    readonly passwordHasher;
    readonly jwtService:JwtService
    readonly prismaProvider;
    readonly unitOfWork;
    readonly refreshTokenService;
    readonly executionContextProvider;
    readonly metrics;
    constructor(){
        this.config = new Config();
        this.executionContextProvider = new AsyncLocalExecutionContextProvider();

        this.logger = this.config.loggerProvider ==="powertools"? new PowertoolsLogger(this.config.serviceName,this.executionContextProvider): new ConsoleLogger(this.executionContextProvider);
        this.prisma = PrismaClientFactory.getClient(this.config);
        this.prismaProvider= new PrismaProvider(this.prisma, this.executionContextProvider);
        this.passwordHasher = new BcryptPasswordHasher();
        this.jwtService = new JoseJwtServiceImpl(this.config.jwtSecret, this.config.jwtExpirationTime+"h");
        this.refreshTokenService = new BcryptRefreshTokenServiceImpl();
        this.unitOfWork = new PrismaUnitOfWork(this.prisma, this.executionContextProvider);
        this.metrics = new Metrics({namespace:"NovaOMS", serviceName: this.config.serviceName});
    }

}
