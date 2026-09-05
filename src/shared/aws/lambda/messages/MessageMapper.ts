import { SQSRecord } from "aws-lambda";

export interface EventBridgeEvent<TDetail = unknown> {
    id: string;
    source: string;
    "detail-type": string;
    detail: TDetail;
    time: string;
    region: string;
    account: string;
}

export function normalizeSqsMessage(record: SQSRecord): unknown {
    const body = JSON.parse(record.body);

    // SNS -> SQS
    if (
        body.Type === "Notification" &&
        typeof body.Message === "string"
    ) {
        return JSON.parse(body.Message);
    }

    // EventBridge -> SQS
    if (
        typeof body.id === "string" &&
        typeof body.source === "string" &&
        typeof body["detail-type"] === "string" &&
        body.detail !== undefined
    ) {
        return body;
    }

    // SQS directo
    return body;
}