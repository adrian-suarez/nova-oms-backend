import { S3Event } from "aws-lambda";
import { EventBridgeEvent } from "./MessageMapper.js";



export function isEventBridgeEvent(msg:unknown): msg is EventBridgeEvent{

    return (typeof msg=== "object" && msg!== null &&
        typeof (msg as EventBridgeEvent).source === "string" &&
        typeof (msg as EventBridgeEvent)["detail-type"] === "string" &&
        "detail" in msg
    );
}

export function isS3Event(msg:unknown): msg is S3Event{

    return (typeof msg=== "object" && msg!== null &&
        Array.isArray ((msg as S3Event).Records) &&
        (msg as S3Event).Records?.[0]?.s3 !== undefined
    );
}