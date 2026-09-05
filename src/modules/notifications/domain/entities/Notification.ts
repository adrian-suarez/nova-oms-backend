


export enum NotificationType {
    USER_WELCOME = "USER_WELCOME",
    USER_UPDATED = "USER_UPDATED",
    USER_DISABLED = "USER_DISABLED",

    ATTACHMENT_PROCESSING = "ATTACHMENT_PROCESSING",
    ATTACHMENT_UPLOADED = "ATTACHMENT_UPLOADED",
    ATTACHMENT_FAILED = "ATTACHMENT_FAILED",
    ATTACHMENT_DELETED = "ATTACHMENT_DELETED"

}

export enum NotificationChannel {
    EMAIL = "EMAIL",
    // SMS, PUSH
}

export enum NotificationStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    FAILED = "FAILED"
}

export class Notification {
    constructor(readonly id: string, 
        readonly type: NotificationType,
        readonly channel: NotificationChannel,
        readonly recipientUserId: string,
        readonly recipientUserEmail: string,
        readonly subject: string,
        readonly message: string,
        private _status: NotificationStatus,
        readonly createdAt: Date,
        private _sentAt: Date| null,
        private _lastError: string | null
    ){}

    get status(){
        return this._status;
    }

    get sentAt(){
        return this._sentAt;
    }

    get lastError(){
        return this._lastError;
    }

    markSent(sentAt:Date){
        this._status = NotificationStatus.SENT;
        this._sentAt = sentAt;
    }

    markFailed(error:string){
        this._status = NotificationStatus.FAILED;
        this._lastError = error;
    }
}
