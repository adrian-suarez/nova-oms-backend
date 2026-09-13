
export enum SortDirection {
    ASC = "asc",
    DESC = "desc"
}

export enum FilterOperator {
    EQ= "eq",
    NE= "ne",
    GT= "gt",
    GTE= "gte",
    LT= "lt",
    LTE= "lte",
    LIKE= "like",
    IN= "in"
}

export class Sort {
    constructor(readonly field:string,
        readonly direction:SortDirection = SortDirection.ASC){}
}

export class Filter {
    constructor(readonly field: string,
        readonly operator: FilterOperator,
        readonly value: unknown){}
}

export class Pagination {
    constructor (readonly page: number,
    readonly pageSize:number){}

    get offset(){
        return (this.page -1)*this.pageSize;
    }
}
export class QueryOptions {
    constructor(readonly pagination: Pagination,
        readonly sort: Sort,
        readonly filters: Filter[]=[]){}
}