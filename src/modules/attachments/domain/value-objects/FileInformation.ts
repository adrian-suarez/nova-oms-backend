import { ValidationError } from "@shared/errors/ValidationError.js";

export class FileInformation{
    constructor(readonly fileName:string,
        readonly extension: string,
        readonly contentType: string,
        readonly size: number
    ){
        if(!fileName.trim()){
            throw new ValidationError("File name is required");
        }
        if(!extension.trim()){
            throw new ValidationError("Extension is required");
        }
        if(!contentType.trim()){
            throw new ValidationError("Content Type is required");
        }

        if(size<=0){
            throw new ValidationError("Invalid file size");
        }
    }
}