// scripts/dev-tools/local-queue-poller.ts
//
// Herramienta de desarrollo local, sin mantenimiento formal — no es parte del build real
// (excluida de tsconfig/eslint, ver instrucciones más abajo). Sirve para ver mensajes reales
// de una cola SQS de LocalStack sin desplegar el Lambda. Usa normalizeSqsMessage(), el mismo
// helper que usa el SqsLambdaHandler real, para mantener el comportamiento consistente con producción.
//
// Uso: npx tsx scripts/dev-tools/local-queue-poller.ts

import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from "@aws-sdk/client-sqs";
import { SQSRecord, Context } from "aws-lambda";
import { normalizeSqsMessage } from "@shared/aws/lambda/messages/MessageMapper.js";
import { UserQueueConsumerHandler } from "@modules/users/presentation/consumers/UserQueueConsumerHandler.js";

interface QueueConsumerHandler {
    handle(event: unknown, context: Context): Promise<void>;
}

interface QueueConsumerConfig {
    name: string;
    queueUrl: string;
    handler: QueueConsumerHandler;
}

const sqs = new SQSClient({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const fakeContext = {} as Context;

function toSqsRecord(message: Message): SQSRecord {
    return {
        messageId: message.MessageId!,
        receiptHandle: message.ReceiptHandle!,
        body: message.Body!,
        attributes: {} as SQSRecord["attributes"],
        messageAttributes: {},
        md5OfBody: message.MD5OfBody ?? "",
        eventSource: "aws:sqs",
        eventSourceARN: "",
        awsRegion: "us-east-1",
    } as SQSRecord;
}

async function processMessage(config: QueueConsumerConfig, message: Message): Promise<boolean> {
    try {
        const normalized = normalizeSqsMessage(toSqsRecord(message));
        await config.handler.handle(normalized, fakeContext);
        return true;
    } catch (error) {
        console.error(`[${config.name}] Falló procesando ${message.MessageId}:`, error);
        return false;
    }
}

async function pollQueue(config: QueueConsumerConfig) {
    console.log(`[${config.name}] Escuchando: ${config.queueUrl}`);

    while (true) {
        const { Messages } = await sqs.send(new ReceiveMessageCommand({
            QueueUrl: config.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 10,
        }));

        if (!Messages?.length) continue;

        console.log(`[${config.name}] Recibidos ${Messages.length} mensaje(s)`);

        for (const message of Messages) {
            const succeeded = await processMessage(config, message);
            if (succeeded) {
                await sqs.send(new DeleteMessageCommand({
                    QueueUrl: config.queueUrl,
                    ReceiptHandle: message.ReceiptHandle!,
                }));
            }
        }
    }
}

export function startLocalPollers(configs: QueueConsumerConfig[]) {
    configs.forEach((config) => {
        pollQueue(config).catch((err) => {
            console.error(`[${config.name}] Poller crasheó:`, err);
        });
    });
}

startLocalPollers([
    { name: "UserEvents", queueUrl: "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/novaoms-dev-upload-queue", handler: new UserQueueConsumerHandler() },
]);
