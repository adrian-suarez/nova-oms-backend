import { Permission } from "./Permission.js";

export enum Roles{
    ADMIN = "ADMIN"
}

export interface UpdateRoleData{
    name?:string;
    description?:string;
    permissions?:Permission[];
    enabled?:boolean;
}


export class Role {
    constructor(readonly id:string,
        public name: string,
        public description:string,
        private _permissions:Permission[],
        public enabled:boolean,
        public version:number,
        public createdAt:Date,
        public updatedAt?:Date| null,
        public deletedAt?:Date| null,
    ){}
    
    static create (data:{ name: string, description:string}){
        return new Role(crypto.randomUUID(), data.name, data.description,[], true,0,new Date());
    }

    get permissions(){
        return this._permissions;
    }

    setPermissions(permissions : Permission[]){
        this._permissions=permissions;
    }
    update(data:UpdateRoleData):boolean{
        let isUpdated = false;
        if(data.name != undefined){
            this.name = data.name;
            isUpdated=true;
        }
        if(data.description != undefined){
            this.description = data.description;
            isUpdated=true;
        }
      
        if(data.enabled != undefined){
            this.enabled = data.enabled;
            isUpdated=true;
        }

        return isUpdated;
      
    }
    
    get permissionsNames():string[]{
        return [...new Set(this._permissions.map(p=>p.name))];
    }
}
