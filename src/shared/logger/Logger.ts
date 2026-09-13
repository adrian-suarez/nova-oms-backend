export interface Logger {
  info(message: string, extra?: Record<string, unknown>): void;
  warn(message: string, extra?: Record<string, unknown>): void;
  error(message: string, extra?: Record<string, unknown>): void;
  debug(message: string, extra?: Record<string, unknown>): void;
}


export function serializeExtra(extra: Record<string, unknown>){
    if("error" in extra && extra.error instanceof Error){
      return {
        ...extra,
        error: {name: extra.error.name, message: extra.error.message, stack: extra.error.stack}
      }
    }

    return extra;
   
  }