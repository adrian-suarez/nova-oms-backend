

export class Page<T>{
    constructor(readonly items: T[],
        readonly page: number,
        readonly pageSize:number,
        readonly totalItems: number,
    ){}

    get totalPages(){
        return Math.ceil(this.totalItems/this.pageSize)
    }
}

