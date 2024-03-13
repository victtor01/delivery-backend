import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthConfirmEmailDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
