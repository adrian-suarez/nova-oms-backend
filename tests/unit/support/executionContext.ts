import { ExecutionContext } from "@shared/application/context/ExecutionContext.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { mock } from "vitest-mock-extended";


export function makeExecutionContextProvider(
    requestId = "req-1",
    correlationId = "corr-1",
    handlerName = "TestHandler"
){

    const context = new ExecutionContext({},requestId,correlationId, handlerName);
    const executionContextProvider = mock<ExecutionContextProvider>();

    executionContextProvider.get.mockReturnValue(context);
    executionContextProvider.run.mockImplementation(async(_ctx,callback)=>callback());

    return { executionContextProvider, context};
}