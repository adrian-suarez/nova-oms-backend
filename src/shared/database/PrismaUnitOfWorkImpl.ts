import { PrismaClient } from "@prisma/client";
import { UnitOfWork } from "./UnitOfWork.js";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";


export class PrismaUnitOfWork implements UnitOfWork{
    constructor(private readonly prisma: PrismaClient,
        private readonly executionContextProvider: ExecutionContextProvider){}

    execute<T>(action: () => Promise<T>):Promise<T>{
        return this.prisma.$transaction(async(tx)=>{
            const context = this.executionContextProvider.get();

            context?.setTransaction(tx);
            try{
                return await action();
            }finally{
                context?.setTransaction();
            }
        },{timeout:10000});
    }
    
}