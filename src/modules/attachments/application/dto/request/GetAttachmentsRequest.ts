import { PageRequest } from "@shared/application/dto/PageRequest.js";


export interface GetAttachmentsRequest extends PageRequest {
    id?:string;
    status?:string;
    uploadedById?:string;
}