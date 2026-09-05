import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Config } from "@shared/config/Config.js";
import { Environment } from "@shared/config/Environment.js";
import * as AWSXRayNS from "aws-xray-sdk-core";

// aws-xray-sdk-core es CJS puro sin "exports" — bajo tsx (type:module) Node no
// detecta captureAsyncFunc como named export y queda undefined; el fallback a
// .default es necesario para que el seed y `pnpm dev` no rompan con
// "captureAsyncFunc is not a function". Bajo esbuild (Lambda bundleada) el
// import ya resuelve bien de por sí — este fallback no afecta ese camino.
const AWSXRay = ((AWSXRayNS as unknown as { default?: typeof AWSXRayNS }).default ?? AWSXRayNS);

let prisma: PrismaClient | undefined;
function createPrismaClient(config:Config){
    const adapter = new PrismaPg({connectionString: config.dbUrl});

    // Sin contexto real de Lambda, captureAsyncFunc solo registra "Missing AWS Lambda
    // trace data" — inofensivo pero inunda la consola (una vez por query) en seed/
    // pnpm dev. Se salta la instrumentación por completo fuera de Lambda real, no
    // solo se silencia el log.
    const isLambdaRuntime = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

    const client =  new PrismaClient({
        adapter,
        log:config.environment==Environment.DEVELOPMENT ? ["error","warn"] : ["error"]
    })
    
    if(!isLambdaRuntime){
        return client;
    }
    
    
    return client.$extends({
        query: {
            async $allOperations({operation,model,args, query}){
                return AWSXRay.captureAsyncFunc(`prisma.${model}.${operation}`, async (subsegment)=> {
                        try{
                            return await query(args);
                        }catch(error){
                            subsegment?.addError(error as Error);
                            throw error;
                        }finally{
                            subsegment?.close();
                        }
                    }
                );
            
            },
        },
    });
}


export class PrismaClientFactory {
    static getClient(config: Config):PrismaClient{
        if(!prisma){
            prisma = createPrismaClient(config) as PrismaClient;
        }

        return prisma;
    }
}