import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AuthSendEmailToConfirmAccountDto } from './dto/auth-send-email-to-confirm-account.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

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
      providers: [AuthService, UsersService, EmailService, JwtService, ConfigService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);
    jwtService = module.get<JwtService>(JwtService);

    userMock = new User({
      firstName: 'example',
      lastName: 'example',
      email: 'test@example.com',
      password: 'test',
      status: 'ACTIVATED',
    });
  });

  it('to be defined', () => {
    expect(usersService).toBeDefined();
    expect(authService).toBeDefined();
    expect(emailService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  // sendEmail method

  describe('sendEmailToConfirmAccount', () => {
    // send email SUCCESS to user
    it('should send email for valid user with status created', async () => {
      // create dto
      const dto: AuthSendEmailToConfirmAccountDto = {
        email: 'example@example.com',
      };

      // Mock successful response from UsersService and JwtService
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValueOnce({ ...userMock, status: 'CREATED' });
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('validToken');

      // Call the method being tested
      const response = await authService.sendEmailToConfirmAccount(dto);

      // Expectations
      expect(response.error).toBe(false);
      expect(response.message).toBe('Email enviado com sucesso!');
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        html: expect.stringContaining('Confirmar email'),
        to: dto.email,
      });
    });

    // Test case for invalid user
    it('should throw BadRequestException for invalid user', async () => {
      // Mock response from UsersService for an invalid user
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);
      const dto: AuthSendEmailToConfirmAccountDto = {
        email: 'nonexistent@example.com',
      };

      // Expecting the method to throw BadRequestException
      expect(authService.sendEmailToConfirmAccount(dto)).rejects.toThrow(
        new BadRequestException('Usuário não encontrado!'),
      );
    });

    // Test case for user with status different from created
    it('should throw BadRequestException for user with status different from created', async () => {
      const dto: AuthSendEmailToConfirmAccountDto = {
        email: 'example@example.com',
      };

      // Mock response from UsersService for a user with status ACTIVATED
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValueOnce({ ...userMock, status: 'ACTIVATED' });

      // Expecting the method to throw BadRequestException
      expect(authService.sendEmailToConfirmAccount(dto)).rejects.toThrow(
        new BadRequestException('Usuário não pode ser verificado!'),
      );

      expect(usersService.findByEmail).toHaveBeenCalledTimes(1);
    });

    // Test case for error in sending email
    it('should throw BadRequestException for error in send email', async () => {
      userMock.status = 'CREATED';

      const dto: AuthSendEmailToConfirmAccountDto = {
        email: 'test@example.com',
      };

      // Mock response from UsersService and EmailService for an error in sending email
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(userMock);
      jest.spyOn(emailService, 'sendEmail').mockRejectedValueOnce(new Error());

      // Expecting the method to throw BadRequestException
      expect(authService.sendEmailToConfirmAccount(dto)).rejects.toThrow(
        new BadRequestException('Houve um erro ao tentar enviar email'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledTimes(1);
    });
  });

  // confirm email method

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

  /**
   * Description: Test suite for login method.
   */
  describe('login', () => {
    // Test case for successful login
    it('should success login', async () => {
      // Destructure email and password from userMock
      const { email, password } = userMock,
        data = { email, password };

      // Mock successful response from UsersService and JwtService
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue({ ...userMock, status: 'ACTIVATED' });

      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('access_token');

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('refresh_token');

        jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('session');

      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => {
        return true;
      });

      const responseMock = {
        cookie: jest.fn(),
      } as unknown as Response;

      // Call the method being tested
      const res = await authService.login(data, responseMock);

      // Expectations
      expect(res).toBeDefined();
      expect(res.access_token).toEqual('access_token');
      expect(res.refresh_token).toEqual('refresh_token');
    });

    // Test case for incorrect password
    it('should error because incorrect password', async () => {
      // Destructure email from userMock
      const email = userMock.email;

      const dto = {
        // email exists
        email,
        // incorrect password
        password: 'incorrect',
      };

      // Mock response from UsersService
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(userMock);

      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => {
        return false;
      });

      const responseMock = {
        cookie: jest.fn(),
      } as unknown as Response;

      // Expectations
      expect(authService.login(dto, responseMock)).rejects.toThrow(
        new UnauthorizedException('senha incorreta'),
      );
    });
  });
});
