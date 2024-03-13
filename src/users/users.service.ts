import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users-repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: UsersRepository) {}

  private saltHashPassoword = 10;
  private async hashUserPassword(pass: string): Promise<string> {
    return await bcrypt.hash(pass, this.saltHashPassoword);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userExists = await this.userRepo.findByEmail(createUserDto.email);

    if (userExists?.email) {
      throw new BadRequestException('usuário já existente');
    }

    // create user entity
    const user = new User(createUserDto);

    user.password = await this.hashUserPassword(user.password);
    return await this.userRepo.store(user);
  }

  findByEmail(email: string) {
    return this.userRepo.findByEmail(email);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepo.update(id, updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
