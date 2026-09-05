import { StorageDownloadRequest } from "../dto/request/StorageDownloadRequest.js";
import { StorageRequest } from "../dto/request/StorageRequest.js";
import { StorageUploadRequest } from "../dto/request/StorageUploadRequest.js";


export interface StorageProvider{
    generateUploadUrl(request:StorageUploadRequest):Promise<string>;
    generateDownloadUrl(request: StorageDownloadRequest):Promise<string>;
    exists(request: StorageRequest):Promise<boolean>;
    getObjectRange(request: StorageRequest,start:number,end:number):Promise<Buffer<ArrayBuffer>>;
    delete(request: StorageRequest):Promise<void>;
}