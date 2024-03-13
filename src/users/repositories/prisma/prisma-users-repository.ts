import { User } from '../../../users/entities/user.entity';
import { UsersRepository } from '../users-repository';
import { PrismaService } from '../../../database/prisma.service';
import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from '../../../users/dto/update-user.dto';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async store(data: User): Promise<User> {
    return await this.prismaService.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User> {
    return await this.prismaService.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return await this.prismaService.user.update({
      where: { id },
      data,
    });
  }
}
