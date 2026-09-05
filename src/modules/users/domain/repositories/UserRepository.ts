import { Page } from "@shared/domain/entities/Page.js";
import { User } from "../entities/User.js";
import { QueryOptions } from "@shared/domain/entities/Query.js";


export interface UserRepository{
    create(user:User):Promise<void>;
    update(user:User):Promise<void>;
    findAll(options:QueryOptions):Promise<Page<User>>;
    findById(id:string):Promise<User|null>;
    findByIdWithRoles(id:string):Promise<User|null>;
    findByEmail(email:string):Promise<User|null>;
    findByEmailWithRole(email:string):Promise<User|null>;    
    delete(id:string, force?:boolean):Promise<void>;

}