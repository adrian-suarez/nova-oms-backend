

export interface Idempotency{

    id: string;
    requestHash: string;
    status?: string;
    statusCode?: number;
    responseBody?: unknown;
    createdAt?: Date;
}