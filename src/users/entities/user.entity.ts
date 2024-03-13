import { IsDateString, IsEmail, IsString } from 'class-validator';
import { CreateUserDto } from '../dto/create-user.dto';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

export class User {
  @IsString()
  public readonly id: string = randomUUID();
  @IsString()
  public firstName: string;
  @IsString()
  public lastName: string;
  @IsEmail()
  public email: string;
  @IsString()
  public password: string;

  @IsDateString()
  createdAt: Date = new Date();
  @IsDateString()
  updatedAt: Date = new Date();

  status: UserStatus = 'CREATED';

  constructor(data: CreateUserDto) {
    Object.assign(this, data);
  }

}

export type UserStatus = 'CREATED' | 'VERIFIED' | 'DISABLED' | 'ACTIVATED';
