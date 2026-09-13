import { StorageRequest } from "./StorageRequest.js";


export interface StorageDownloadRequest extends StorageRequest{
    expiresIn: number;
}
