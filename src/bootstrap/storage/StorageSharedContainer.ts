import { S3Client } from "@aws-sdk/client-s3";
import { StorageKeyGenerator } from "@modules/attachments/application/services/StorageKeyGenerator.js";
import { StoragePolicy } from "@modules/attachments/application/services/StoragePolicy.js";
import { S3StorageProviderImpl } from "@modules/attachments/infrastructure/providers/S3StorageProviderImpl.js";
import { StorageConfig } from "@shared/config/StorageConfig.js";
import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";
import * as AWSXRay from "aws-xray-sdk-core";


export class StorageSharedContainer {

    readonly storageConfig;
    readonly s3Client;
    readonly storageProvider;
    readonly storagePolicy;
    readonly storageKeyGenerator;

    constructor(container: SharedContainer){
        this.storageConfig = new StorageConfig();

        if(container.config.endpoint){
            this.s3Client = new S3Client({
                region: container.config.awsRegion,
                endpoint: container.config.endpoint,
                forcePathStyle: this.storageConfig.forcePathStyle
            });
        }else{
            this.s3Client = new S3Client({
                region: container.config.awsRegion
            });
        }
        AWSXRay.captureAWSv3Client(this.s3Client);

        this.storageProvider = new S3StorageProviderImpl(this.s3Client);
        this.storagePolicy = new StoragePolicy(this.storageConfig);
        this.storageKeyGenerator = new StorageKeyGenerator();

    }

}
