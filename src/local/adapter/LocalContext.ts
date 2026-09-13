import { Context } from "aws-lambda";

export class LocalContext{
    
    static create (): Context {
        return {
            callbackWaitsForEmptyEventLoop: false,
            functionName: "local",
            functionVersion: "local",
            invokedFunctionArn: "local",
            memoryLimitInMB: "128",
            awsRequestId: crypto.randomUUID(),
            logGroupName: "local",
            logStreamName: "local",
            getRemainingTimeInMillis: ()=> 30000,
            done(){},
            fail(){},
            succeed(){}
        };
}
}