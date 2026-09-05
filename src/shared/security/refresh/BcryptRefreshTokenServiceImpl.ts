import { RefreshTokenService } from "./RefreshTokenService.js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export class BcryptRefreshTokenServiceImpl implements RefreshTokenService{
    async generate(): Promise<string> {
        return crypto.randomBytes(64).toString("base64url");
    }
    hash(token: string): Promise<string> {
        return bcrypt.hash(token,12);
    }
    verify(token: string, hash: string): Promise<boolean> {
        return bcrypt.compare(token, hash);
    }

}