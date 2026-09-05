import { UnauthorizedError } from "@shared/errors/UnauthorizedError.js";

export class UserSession {
    constructor(readonly id:string,
        readonly userId: string,
        private _refreshTokenHash:string,
        readonly device: string|null,
        readonly ip: string|null,
        private _expiresAt: Date,
        readonly createdAt: Date,
        readonly _revokedAt: Date|null,
    ){}

    get revoked(){
        return this._revokedAt!==null;
    }

    get revokedAt(){
        return this._revokedAt;
    }
    get refreshTokenHash():string {
        return this._refreshTokenHash;
    }

    get expiresAt():Date {
        return this._expiresAt;
    }

    rotate(refreshTokenHash:string, expiresAt:Date){
        if(this.revoked){
            throw new UnauthorizedError("Session revoked");
        }
        this._refreshTokenHash = refreshTokenHash;
        this._expiresAt = expiresAt;
    }


}