import { FileInformation } from "@modules/attachments/domain/value-objects/FileInformation.js";
import { StorageConfig } from "@shared/config/StorageConfig.js";
import { ValidationError } from "@shared/errors/ValidationError.js";


export class StoragePolicy {

    constructor(private readonly storageConfig:StorageConfig
    ){}


    validate(file: FileInformation): void {
        
        if(file.size>this.storageConfig.maxFileSize){
            throw new ValidationError("Maximum file size exceeded");
        }
        if(!this.storageConfig.allowedExtensions.has(file.extension)){
            throw new ValidationError("Extension not allowed");
        }
       if(!this.storageConfig.allowedContentTypes.has(file.contentType)){
            throw new ValidationError("Content type not allowed");
        }
    }
    
}