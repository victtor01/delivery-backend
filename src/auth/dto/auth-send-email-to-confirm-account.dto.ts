import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthSendEmailToConfirmAccountDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
