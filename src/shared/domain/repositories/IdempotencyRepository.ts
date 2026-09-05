import { Idempotency } from "../entities/Idempotency.js";

export interface IdempotencyRepository{

    claim(idempotency:Idempotency):Promise<boolean>;
    complete(idempotency:Idempotency):Promise<void>;
    release(idempotency:Idempotency):Promise<void>;
    findByKey(key:string):Promise<Idempotency|null>;

}