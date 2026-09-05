import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { Logger, serializeExtra } from "./Logger.js";
import { Logger as AwsLogger } from "@aws-lambda-powertools/logger";

export class PowertoolsLogger implements Logger{

    private readonly logger;

    constructor(serviceName:string,readonly contextProvider: ExecutionContextProvider){
        this.logger = new AwsLogger({serviceName});
    }

    info(message: string, metadata?: Record<string, unknown>): void {
        this.logger.info(message,this.getExtraData(metadata));
    }
    warn(message: string, metadata?: Record<string, unknown>): void {
        this.logger.warn(message,this.getExtraData(metadata));
    }
    error(message: string, error?: Record<string, unknown>): void {
        this.logger.error(message,this.getExtraData(error));
    }
    debug(message: string, metadata?: Record<string, unknown>): void {
        this.logger.debug(message,this.getExtraData(metadata));
    }
    

    private getExtraData( extra: Record<string, unknown>={}):Record<string,string>{
        let logContext = {};
        try{
            logContext = this.contextProvider.get().toLogContext();

        }catch(error){
            console.error("Failed log context",error);
        }

        return { ...logContext, ...serializeExtra(extra)};
    }
}
