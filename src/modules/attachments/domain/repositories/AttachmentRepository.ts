import { Page } from "@shared/domain/entities/Page.js";
import { Attachment } from "../entities/Attachment.js";
import { QueryOptions } from "@shared/domain/entities/Query.js";


export interface AttachmentRepository{
    create(attachment:Attachment):Promise<void>;
    update(attachment:Attachment):Promise<void>;
    findAll(query:QueryOptions):Promise<Page<Attachment>>;
    findById(id:string):Promise<Attachment|null>;  
    findByKey(key:string):Promise<Attachment|null>;  
    delete(id:string):Promise<void>;

}