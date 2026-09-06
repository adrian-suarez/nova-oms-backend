import { circuitBreaker, ConsecutiveBreaker, handleAll, retry, ExponentialBackoff, wrap, IPolicy, handleWhen, timeout, TimeoutStrategy, CircuitState, BrokenCircuitError } from "cockatiel";
import {Metrics, MetricUnit} from "@aws-lambda-powertools/metrics"
import * as AWSXRayNS from "aws-xray-sdk-core";

// aws-xray-sdk-core es CJS puro sin "exports" — bajo tsx (type:module) Node no
// detecta getSegment como named export y queda undefined; el fallback a
// .default es necesario para que el seed y `pnpm dev` no rompan con
// "getSegment is not a function". Bajo esbuild (Lambda bundleada) el import
// ya resuelve bien de por sí — este fallback no afecta ese camino.
const AWSXRay = ((AWSXRayNS as unknown as { default?: typeof AWSXRayNS }).default ?? AWSXRayNS);

export interface ResiliencePolicyConfig{
    consecutiveFailures?:number;
    halfOpenAfterMs?: number;
    maxAttempts?: number;
    isTransientError?: (error:unknown)=>boolean,
    timeoutMs?: number;
    metricName: string;
}

export class ResiliencePolicyFactory{

    static create(config:ResiliencePolicyConfig, metrics:Metrics): IPolicy{

        const filter = config.isTransientError? handleWhen(config.isTransientError): handleAll;
        
        const timeoutPolicy = timeout(config.timeoutMs ?? 5_000, TimeoutStrategy.Aggressive);
        const breaker = circuitBreaker(filter,{
            halfOpenAfter: config.halfOpenAfterMs ?? 10_000,
            breaker: new ConsecutiveBreaker( config.consecutiveFailures ?? 5)
        });

        breaker.onStateChange((state)=> {
            if(state === CircuitState.Open){
                metrics.addDimension("provider", config.metricName);
                metrics.addMetric("CircuitBreakerOpened", MetricUnit.Count, 1);
            }
        });

        const retryPolicy = retry(filter, {
            maxAttempts: config.maxAttempts ?? 3,
            backoff: new ExponentialBackoff()
        });

        retryPolicy.onRetry((_)=>{
            metrics.addDimension("provider", config.metricName);
            metrics.addMetric("RetryAttempt",MetricUnit.Count,1);
        });

        const rawPolicy =  wrap (retryPolicy, breaker,timeoutPolicy);

        return {
            execute: async (fn)=>{
                try{
                    return await rawPolicy.execute(fn);
                }catch(error){
                    const segment = AWSXRay.getSegment();

                    if(error instanceof BrokenCircuitError){
                        segment?.addAnnotation("circuitBreakerState","open");
                    }

                    throw error;
                }
            }
        } as IPolicy
    }

}

