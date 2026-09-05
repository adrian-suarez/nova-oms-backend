
export interface UnitOfWork {

    execute<T>(action:()=>Promise<T>):Promise<T>;
}