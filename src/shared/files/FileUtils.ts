import { ValidationError } from "@shared/errors/ValidationError.js";


export class FileUtils{
    static getExtension(fileName:string):string{
        const extension = fileName.split(".").pop()?.toLocaleLowerCase();

        if(!extension){
            throw new ValidationError("Invalid file name");
        }

        return extension;

    }
}