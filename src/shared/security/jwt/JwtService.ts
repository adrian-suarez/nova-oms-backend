import { JwtClaims } from "./JwtClaims.js";


export interface JwtService{

    generate(claims:JwtClaims):Promise<string>;
    verify(token:string):Promise<JwtClaims>;

}