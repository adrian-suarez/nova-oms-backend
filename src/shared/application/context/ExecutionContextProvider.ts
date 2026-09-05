import { ExecutionContext } from "./ExecutionContext.js";

export interface ExecutionContextProvider{
    get(): ExecutionContext;
    run<T>(context: ExecutionContext,
        callback: ()=> Promise<T>
    ):Promise<T>;
}