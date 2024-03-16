import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthService } from './auth.service';
import { Public } from '../constants';
import { AuthSendEmailToConfirmAccountDto } from './dto/auth-send-email-to-confirm-account.dto';
import { AuthLoginInterfaceReturn } from './interfaces/auth-login-return';
import { AuthVerifyPassport } from './dto/auth-verify-password.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body() data: AuthLoginDto,
  ): Promise<AuthLoginInterfaceReturn> {
    return await this.authService.login(data, response);
  }

  @Public()
  @Get('confirm-email/:email')
  async ConfirmEmail(@Param('email') email: string) {
    return await this.authService.confirmEmail(email);
  }

  @Post('private')
  async PrivateTest() {
    console.log('rota privada!');
  }

  @Public()
  @Post('refresh')
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return await this.authService.refreshToken(req, res);
  }

  @Public()
  @Post('send-email')
  async SendEmail(@Body() body: AuthSendEmailToConfirmAccountDto) {
    return await this.authService.sendEmailToConfirmAccount(body);
  }

  @Post('verify-passport')
  async verifyPassport(@Body() body: AuthVerifyPassport) {
    const { access_token } = body;
    return await this.authService.verifyJwt({ access_token });
  }
}
