export class Permission {
    constructor(readonly id:string, readonly name: string, readonly description:string){}
    
    static create (data:{name:string, description:string}){
        return new Permission(crypto.randomUUID(), data.name, data.description);
    }
}