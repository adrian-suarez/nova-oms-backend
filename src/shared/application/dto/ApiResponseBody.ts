

export interface ApiResponseBody<T>{
    data: T;
}

export interface ApiErrorResponseBody{
    code:string;
    message:string;
    details?: unknown;
}


export interface Pagination {
    page: number;
    pageSize:number;
    totalItems: number;
    totalPages:number;
}

export interface PaginatedResponse<T>{
    items:T[];
    pagination:Pagination;
}