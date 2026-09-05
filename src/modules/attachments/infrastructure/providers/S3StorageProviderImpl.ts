import { StorageDownloadRequest } from "@modules/attachments/application/dto/request/StorageDownloadRequest.js";
import { StorageRequest } from "@modules/attachments/application/dto/request/StorageRequest.js";
import { StorageUploadRequest } from "@modules/attachments/application/dto/request/StorageUploadRequest.js";
import { StorageProvider } from "@modules/attachments/application/providers/StorageProvider.js";
import {DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, NotFound, PutObjectCommand, S3Client} from "@aws-sdk/client-s3"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"

export class S3StorageProviderImpl implements StorageProvider{

    constructor(private readonly client: S3Client){
    }
   
    async getObjectRange(request: StorageRequest, start: number, end: number): Promise<Buffer<ArrayBuffer>> {
        const response = await this.client.send(new GetObjectCommand({
            Bucket: request.bucket,
            Key: request.key,
            Range:`bytes=${start}-${end}`
        }));

        const chunks:Uint8Array[] = [];
        for await(const chunk of response.Body as AsyncIterable<Uint8Array>){
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    }
    generateUploadUrl(request: StorageUploadRequest): Promise<string> {
        return getSignedUrl(
            this.client,
            new PutObjectCommand({
                Bucket:request.bucket,
                Key: request.key,
                ContentType: request.contentType
            }),
            {
                expiresIn: request.expiresIn
            }
        );
        
    }
    generateDownloadUrl(request: StorageDownloadRequest): Promise<string> {
        return getSignedUrl(
            this.client,
            new GetObjectCommand({
                Bucket:request.bucket,
                Key: request.key,
            })
        );
    }
   
    async exists(request: StorageRequest): Promise<boolean> {
        try{
            await this.client.send(new HeadObjectCommand({
                Bucket: request.bucket,
                Key: request.key
            }));
            return true;
        }catch(error){
            if(error instanceof NotFound){
                return false;
            }
            return false;
        }
    }
    async delete(request: StorageRequest): Promise<void> {
        await this.client.send(new DeleteObjectCommand({
            Bucket: request.bucket,
            Key: request.key
        }));
    }
}