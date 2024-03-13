import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthSendEmailToConfirmAccountDto } from './dto/auth-send-email-to-confirm-account.dto';
import { Public } from '../constants';
import { BadRequestException } from '@nestjs/common';

// Mocks
jest.mock('./auth.service');

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('ConfirmEmail', () => {
    it('should call AuthService.confirmEmail with provided email', async () => {
      const email = 'test@example.com';

      await controller.ConfirmEmail(email);

      expect(authService.confirmEmail).toHaveBeenCalledWith(email);
    });
  });
});
