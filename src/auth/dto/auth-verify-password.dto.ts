import { IsNotEmpty, IsString } from "class-validator";

export class AuthVerifyPassport {
    @IsString()
    @IsNotEmpty()
    access_token: string
}