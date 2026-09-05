import { Page } from "@shared/domain/entities/Page.js";
import { QueryOptions } from "@shared/domain/entities/Query.js";
import { Audit } from "../entities/Audit.js";


export interface AuditRepository{
    create(audits:Audit[]):Promise<void>;
    findAll(options:QueryOptions):Promise<Page<Audit>>;

}