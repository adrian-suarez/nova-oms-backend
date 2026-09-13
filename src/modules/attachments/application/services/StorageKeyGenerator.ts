import { StorageKeyRequest } from "../dto/request/StorageKeyRequest.js";


export class StorageKeyGenerator{
    generate(request: StorageKeyRequest): string {
        
        return ["attachments",request.resourceType,request.resourceId, `${request.id}.${request.extension}`].join("/");
    }

}