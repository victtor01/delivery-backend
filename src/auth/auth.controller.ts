import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthService } from './auth.service';
import { Public } from '../constants';
import { AuthSendEmailToConfirmAccountDto } from './dto/auth-send-email-to-confirm-account.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  async login(@Body() data: AuthLoginDto) {
    return await this.authService.login(data);
  }

  @Public()
  @Get('confirm-email/:email')
  async ConfirmEmail(@Param('email') email: string) {
    return await this.authService.confirmEmail(email);
  }

  @Public()
  @Post('send-email')
  async SendEmail (@Body() body: AuthSendEmailToConfirmAccountDto) {
    return await this.authService.sendEmailToConfirmAccount(body);
  }

}
