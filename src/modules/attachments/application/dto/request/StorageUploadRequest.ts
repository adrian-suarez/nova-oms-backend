import { StorageRequest } from "./StorageRequest.js";


export interface StorageUploadRequest extends StorageRequest{
    contentType:string;
    expiresIn: number;
}