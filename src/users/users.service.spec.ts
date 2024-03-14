import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users-repository';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaUsersRepository } from './repositories/prisma/prisma-users-repository';
import { PrismaModule } from '../database/prisma.module';
import { BadRequestException } from '@nestjs/common';

jest.mock('./repositories/users-repository');

const exampleUser: CreateUserDto = {
  firstName: 'example',
  lastName: 'example',
  email: 'test@example.com',
  password: 'test',
};

const notExistsUser: CreateUserDto = {
  firstName: 'example',
  lastName: 'example',
  email: 'notExists@example.com',
  password: 'example',
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        UsersService,
        { provide: UsersRepository, useClass: PrismaUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create user', async () => {
      jest.spyOn(repository, 'findByEmail').mockResolvedValue(null);

      jest.spyOn(repository, 'store').mockImplementation(async (user) => {
        const userWithHashedPassword = {
          ...user,
          password: await service.hashUserPassword(user.password),
        };
        return new User(userWithHashedPassword);
      });

      const res = await service.create(notExistsUser);

      expect(res).toBeInstanceOf(User);
      expect(res.status).toEqual('CREATED');
      expect(res.password).not.toEqual(notExistsUser.password);
      expect(repository.store).toHaveBeenCalledTimes(1);
    });

    it('should throw error if user already exists', async () => {
      jest
        .spyOn(repository, 'findByEmail')
        .mockResolvedValue(new User(exampleUser));

      await expect(service.create(exampleUser)).rejects.toThrow(
        new BadRequestException('usuário já existente'),
      );

      expect(repository.findByEmail).toHaveBeenCalledTimes(1);
    });
  });
});
