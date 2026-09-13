import { AggregateRoot } from "@shared/domain/entities/AggregateRoot.js";
import { Role } from "./Role.js";
import { UserUpdatedEvent } from "../events/UserUpdatedEvent.js";
import { UserDeletedEvent } from "../events/UserDeletedEvent.js";
import { UserCreatedEvent } from "../events/UserCreatedEvent.js";

export enum UserStatus{
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    SUSPENDED = "SUSPENDED",
    LOCKED = "LOCKED"
}

export interface UpdateUserData{
    firstName?:string;
    lastName?:string;
    status?:UserStatus;
    enabled?:boolean;
    roles?:Role[];
}

export class User extends AggregateRoot {

    constructor(
        public readonly id:string,
        public email: string,
        public firstName: string,
        public lastName: string,
        public status:UserStatus,
        private _roles: Role[],
        public enabled:boolean,
        public version:number,
        public createdAt:Date,
        public updatedAt?:Date| null,
        public deletedAt?:Date| null,
        public _password?:string | null,
        public cognitoSub?:string | null,
    ){
        super();
    }
    
    static create (data:{email:string, firstName:string, lastName:string, status:UserStatus }){
        const user = new User( crypto.randomUUID(),data.email, data.firstName,data.lastName,data.status,[], true,0, new Date());
        user.addDomainEvent(new UserCreatedEvent(user.id, user.email));

        return user;
    }

    update(data:UpdateUserData):boolean{
        let isUpdated = false;
        if(data.firstName != undefined){
            this.firstName = data.firstName;
            isUpdated=true;
        }
        if(data.lastName != undefined){
            this.lastName = data.lastName;
            isUpdated=true;
        }
        if(data.status != undefined){
            this.status = data.status;
            isUpdated=true;
        }
        if(data.enabled != undefined){
            this.enabled = data.enabled;
            isUpdated=true;
        }     
        if(isUpdated ){
            this.addDomainEvent(new UserUpdatedEvent(this.id, this.email));
        }

        return isUpdated
    }

    setRoles(roles:Role[]){

        this._roles = roles;
        this.addDomainEvent(new UserUpdatedEvent(this.id, this.email));

    }

    get roles(){
        return this._roles;
    }

    requiresIdentitySync(data: UpdateUserData){
        return data.firstName || data.lastName;
    }

    hasPermission(permission:string):boolean{
        return this._roles.some(r=> r.permissions.some(p=>p.name==permission));
    }

    get rolesIds():string[]{
        return this._roles.map(r=>r.id);
    }
    get rolesNames():string[]{
        return this._roles.map(r=>r.name);
    }

    get permissionsNames():string[]{
        return [...new Set(this._roles.flatMap(r=> r.permissions).map(p=>p.name))];
    }

    get password(){
        return this._password;
    }

    setPassword(password: string){
        this._password = password;
    }
    delete(){
        if(this.deletedAt!=null){
            return;
        }

        this.enabled= false;
        this.deletedAt= new Date();

        this.addDomainEvent(new UserDeletedEvent(this.id, this.email));

    }

    reactivate() {
        this.enabled = true;
        this.deletedAt = null;
    }
    
}