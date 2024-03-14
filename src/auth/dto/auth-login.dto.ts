import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthLoginDto {
  @IsEmail({}, { message: 'Email inválido!' })
  @IsNotEmpty({ message: 'Campo email faltando!' })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsNotEmpty({ message: 'Campo senha faltando!' })
  @IsString({ message: 'Campo senha inválido!' })
  password: string;
}
