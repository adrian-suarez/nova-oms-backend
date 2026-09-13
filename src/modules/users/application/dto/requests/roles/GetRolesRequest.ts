import { PageRequest } from "@shared/application/dto/PageRequest.js";


export interface GetRolesRequest extends PageRequest {
    id?:string;
}