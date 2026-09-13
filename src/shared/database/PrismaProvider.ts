import { PrismaClient } from "@prisma/client";
import { ExecutionContextProvider } from "@shared/application/context/ExecutionContextProvider.js";


export class PrismaProvider {
    constructor(private readonly prisma:PrismaClient, private readonly executionContextProvider:ExecutionContextProvider){}
    getClient():PrismaClient{
        const tx = this.executionContextProvider.get()?.getTransaction() as PrismaClient | undefined;

        return tx ?? this.prisma;
    }
}