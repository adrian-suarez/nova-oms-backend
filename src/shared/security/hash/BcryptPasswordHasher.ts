import { PasswordHasher } from "./PasswordHasher.js";
import bcrypt from "bcryptjs";

export class BcryptPasswordHasher implements PasswordHasher{
    hash(password: string): Promise<string> {
        return bcrypt.hash(password,12);
    }
    verify(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password,hash);
    }

}