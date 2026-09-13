import { SecretsManagerClient, PutSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { randomBytes } from "crypto";


const client = new SecretsManagerClient({region:"us-east-1"});

export async function handler(){
    const newSecret = randomBytes(32).toString("hex");

    const command =  new PutSecretValueCommand({SecretId:process.env.SECRET_NAME!, SecretString:JSON.stringify({JWT_SECRET:newSecret})});
    await client.send(command);

    console.log("JWT Secret rotated successfully");
}
