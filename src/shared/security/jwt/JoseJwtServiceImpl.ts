import { jwtVerify, SignJWT } from "jose";
import { JwtService } from "./JwtService.js";
import { JwtClaims } from "./JwtClaims.js";


export class JoseJwtServiceImpl implements JwtService{
    private secret : Uint8Array<ArrayBuffer>;

    constructor(private jwtSecret:string,private jwtExpirationTime:string="24h"){
        this.secret = new TextEncoder().encode(jwtSecret);
    }

    async generate(claims:JwtClaims ): Promise<string> {
        const accessToken = await  new SignJWT({
            sub: claims.sub,
            email: claims.email
        }).setProtectedHeader({alg:"HS256"})
        .setIssuedAt()
        .setExpirationTime(this.jwtExpirationTime)
        .sign(this.secret);


        return accessToken
    }
    async verify(token: string): Promise<JwtClaims> {
        const result = await jwtVerify(token,this.secret);
        const payload = result.payload

        return {
            sub: payload.sub! as string,
            email: payload.email! as string
        };
    }
    
}