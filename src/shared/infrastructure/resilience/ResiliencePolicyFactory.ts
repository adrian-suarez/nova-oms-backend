import { circuitBreaker, ConsecutiveBreaker, handleAll, retry, ExponentialBackoff, wrap, IPolicy, handleWhen, timeout, TimeoutStrategy, CircuitState, BrokenCircuitError } from "cockatiel";
import {Metrics, MetricUnit} from "@aws-lambda-powertools/metrics"
import * as AWSXRay from "aws-xray-sdk-core";

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

