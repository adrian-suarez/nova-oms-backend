

export interface PageRequest {
    page?: number;
    pageSize?:number;

    enabled?:boolean;
    search?:string;
    sortBy?:string;
    sortDirection?:"asc"|"desc";
}