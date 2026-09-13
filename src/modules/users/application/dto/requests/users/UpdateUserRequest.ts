import { UserStatus } from "@modules/users/domain/entities/User.js";


export interface UpdateUserRequest {
    id:string,
    firstName?:string;
    lastName?:string;
    status?:UserStatus;
    enabled?:boolean;
    rolesIds?:string[];
    version: number;
}