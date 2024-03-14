import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AuthSendEmailToConfirmAccountDto } from './dto/auth-send-email-to-confirm-account.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

// Mocks
jest.mock('../users/users.service');
jest.mock('../email/email.service');
jest.mock('bcrypt');
jest.mock('@nestjs/jwt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let emailService: EmailService;
  let jwtService: JwtService;
  let userMock: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UsersService, EmailService, JwtService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);

    userMock = new User({
      firstName: 'teste',
      lastName: 'teste',
      email: 'example@example.com',
      password: 'teste',
    });
  });

  it('to be defined', () => {
    expect(usersService).toBeDefined();
    expect(authService).toBeDefined();
    expect(emailService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('sendEmailToConfirmAccount', () => {
    it('should send email for valid user with status created', async () => {
      const dto: AuthSendEmailToConfirmAccountDto = {
        email: 'example@example.com',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(userMock);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('validToken');

      const response = await authService.sendEmailToConfirmAccount(dto);

      expect(response.error).toBe(false);
      expect(response.message).toBe('Email enviado com sucesso!');
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        html: expect.stringContaining('Confirmar email'),
        to: dto.email,
      });
    });

    it('should throw BadRequestException for invalid user', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);
      const dto: AuthSendEmailToConfirmAccountDto = {
        email: 'nonexistent@example.com',
      };
      expect(authService.sendEmailToConfirmAccount(dto)).rejects.toThrow(
        new BadRequestException('Usuário não encontrado!'),
      );
    });

    it('should throw BadRequestException for user with status different from created', async () => {
      const dto: AuthSendEmailToConfirmAccountDto = {
        email: 'example@example.com',
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValueOnce({ ...userMock, status: 'ACTIVATED' });

      expect(authService.sendEmailToConfirmAccount(dto)).rejects.toThrow(
        new BadRequestException('Usuário não pode ser verificado!'),
      );

      expect(usersService.findByEmail).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for error in send email', async () => {
      const dto: AuthSendEmailToConfirmAccountDto = {
        email: 'example@example.com',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(userMock);
      jest.spyOn(emailService, 'sendEmail').mockRejectedValueOnce(new Error());

      expect(authService.sendEmailToConfirmAccount(dto)).rejects.toThrow(
        new BadRequestException('Houve um erro ao tentar enviar email'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmEmail', () => {
    it('should decode valid token', async () => {
      userMock.status = 'CREATED';

      const decodedMock = {
        id: randomUUID(),
        email: 'example@example.com',
      };

      const userMockUpdated = new User({ ...userMock, status: 'ACTIVATED' });

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(decodedMock);
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(userMock);
      jest.spyOn(usersService, 'update').mockResolvedValueOnce(userMockUpdated);

      const response = await authService.confirmEmail('VALID_TOKEN');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('VALID_TOKEN');
      expect(jwtService.verifyAsync).toHaveBeenCalledTimes(1);
      expect(response).toEqual({
        error: false,
        message: 'usuário verificado!',
      });
    });

    it('should error for invalid token', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(userMock);
      jest.spyOn(jwtService, 'signAsync').mockRejectedValue(new Error());

      expect(authService.confirmEmail('invalid_token')).rejects.toThrow(
        new BadRequestException('houve um erro!'),
      );
    });

    it('should throw an error because of user status not is CREATED', async () => {
      userMock.status = 'ACTIVATED';

      const decodedMock = {
        id: randomUUID(),
        email: 'example@example.com',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(userMock);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(decodedMock);

      expect(authService.confirmEmail('valid_token')).rejects.toThrow(
        new BadRequestException('usuário não pode ser verificado!'),
      );
    });
  });

  describe('login', () => {
    it('should sucesss login', async () => {
      const dto = {
        email: 'userExists@example.com',
        password: 'correctPassword',
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValueOnce({ ...userMock, status: 'ACTIVATED' });
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('refresh_token');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('access_token');
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => {
        return true;
      });

      const res = await authService.login(dto);

      expect(res).toBeDefined();
      expect(res.access_token).toEqual('access_token');
      expect(res.refresh_token).toEqual('refresh_token');
    });
  });
});
