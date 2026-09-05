import { Prisma } from "@prisma/client";
import { AuthenticatedUser } from "@modules/auth/domain/entities/AuthUser.js";


export class ExecutionContext{
    private _request?:unknown;

    private _user?:AuthenticatedUser;
    private _transaction?: Prisma.TransactionClient;

    private readonly _startedAt: number;

    constructor(readonly event: unknown,
        readonly requestId: string,
        private readonly _correlationId: string,
        private handlerName:string
    ){
        this._startedAt = Date.now();
    }

    setRequest(request: unknown): void{
        this._request=request;
    }

    getRequest<T>():T{
        return this._request as T;
    }

    setUser(user:AuthenticatedUser):void{
        this._user= user;
    }

    getUser(optional:boolean=false):AuthenticatedUser |undefined{
        if(!this._user && !optional){
            throw new Error("Authenticated user not found");
        }

        return this._user;
    }

    setTransaction(transaction?:Prisma.TransactionClient ):void{
        this._transaction= transaction;
    }

    getTransaction():Prisma.TransactionClient | undefined{

        return this._transaction;
    }


    get correlationId(){
        return this._correlationId;
    }

    get elapsedMs(){
        return Date.now() - this._startedAt;
    }

    toLogContext(){
        return {
            requestId : this.requestId,
            correlationId: this.correlationId,
            userId: this._user?.id ?? null,
            handlerName: this.handlerName,
            elapsedMs: this.elapsedMs
        }
    }

}