import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";
import { Logger, serializeExtra } from "./Logger.js";

export class ConsoleLogger implements Logger {

  constructor(readonly contextProvider: ExecutionContextProvider){}

  info(message: string, extra: Record<string, unknown> ={}): void {
    this.log("INFO",message, extra);
  }
  warn(message: string, extra: Record<string, unknown>={}): void {
    this.log("WARN",message, extra);
  }
  error(message: string, extra: Record<string, unknown> ={}): void {
    this.log("ERROR",message, extra);
  }
  debug(message: string, extra: Record<string, unknown> = {}): void {
    this.log("DEBUG",message, extra);
  }



  private log(level:string, message:string, extra: Record<string, unknown>={}):void{
    let logContext = {};
    try{
      logContext = this.contextProvider.get().toLogContext();

    }catch(error){
      console.error("Failed log context",error);
    }

    console.log(JSON.stringify({level, message, timestamp: new Date().toISOString(), ...logContext, ...serializeExtra(extra)}));
  }
}
