import { PageRequest } from "@shared/application/dto/PageRequest.js";


export interface GetUsersRequest extends PageRequest {
    id?:string;
    status?:string;
    roleId?:string;
}