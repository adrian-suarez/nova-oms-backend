import { SESClient } from "@aws-sdk/client-ses";
import { SharedContainer } from "@bootstrap/shared/SharedContainer.js";
import { SesConfig } from "@shared/config/SesConfig.js";
import * as AWSXRay from "aws-xray-sdk-core";


export class SesContainer {

    readonly sesConfig;
    readonly sesClient;

    constructor(container: SharedContainer){
        this.sesConfig = new SesConfig();

        if(container.config.endpoint){
            this.sesClient = new SESClient({
                region: container.config.awsRegion,
                endpoint: container.config.endpoint
            });
        }else{
            this.sesClient = new SESClient({
                region: container.config.awsRegion
            });
        }

        AWSXRay.captureAWSv3Client(this.sesClient);        

    }

}
