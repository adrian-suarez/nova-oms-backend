import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Config } from "@shared/config/Config.js";
import { Environment } from "@shared/config/Environment.js";
import * as AWSXRayNS from "aws-xray-sdk-core";

// aws-xray-sdk-core es CJS puro; bajo tsx, captureAsyncFunc no se detecta como
// named export y queda undefined. Fallback a .default necesario para que el
// seed y `pnpm dev` no rompan (esbuild/Lambda ya lo resuelve bien).
const AWSXRay = ((AWSXRayNS as unknown as { default?: typeof AWSXRayNS }).default ?? AWSXRayNS);

let prisma: PrismaClient | undefined;
function createPrismaClient(config:Config){
    // RDS Proxy exige TLS y sslmode en la URL no es confiable con node-postgres, así que se pasa
    // como opción explícita de pg.Pool. rejectUnauthorized:false porque la CA de RDS no está en
    // el store de confianza de Node (sigue siendo tráfico cifrado). Postgres local no usa TLS.
    const ssl = config.environment === Environment.LOCAL ? undefined : { rejectUnauthorized: false };
    const adapter = new PrismaPg({connectionString: config.dbUrl, ssl});

    // Fuera de Lambda real, captureAsyncFunc solo loguea ruido por cada query —
    // se salta la instrumentación entera en vez de solo silenciar el log.
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