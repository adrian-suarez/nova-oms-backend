import { DomainEvent } from "../../domain/entities/DomainEvent.js";

export type DomainEventOutcome = "SUCCESS" | "FAILED";

export interface DomainEventHandler{
    handle(userId:string | null,events:DomainEvent[], outcome: DomainEventOutcome,correlationId:string,reason?: string,):Promise<void>;
}