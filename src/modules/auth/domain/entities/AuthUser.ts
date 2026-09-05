

export interface UserIdentity{
    sub: string;
    email: string;
}
export interface AuthenticationResponse{

    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    
}

export interface AuthRole{
    id: string;
    name: string;
}

export interface AuthPermission{
    id: string;
    name: string;
}
export class AuthenticatedUser{
    constructor(readonly id: string,
    readonly email: string,
    readonly firstName: string,
    readonly lastName:string,
    readonly roles: readonly AuthRole[],
    readonly permissions: readonly AuthPermission[]){}

    hasPermission(permission:string):boolean{
        return this.permissions.find(p=>p.name== permission) !=null;
    }

}