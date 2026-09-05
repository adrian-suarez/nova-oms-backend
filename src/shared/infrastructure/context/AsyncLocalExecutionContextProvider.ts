import { ExecutionContext } from "@shared/application/context/ExecutionContext.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { AsyncLocalStorage } from "node:async_hooks";


export class AsyncLocalExecutionContextProvider implements ExecutionContextProvider{

    private readonly storage = new AsyncLocalStorage<ExecutionContext>();

    get(): ExecutionContext {
        const context = this.storage.getStore();

        if(!context){
            throw new Error("Execution context not initialized");
        }

        return context;
    }
    run<T>(context: ExecutionContext, callback: () => Promise<T>): Promise<T> {
        return this.storage.run(context, callback);
    }

}