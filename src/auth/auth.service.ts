import { UsersService } from '../users/users.service';
import { AuthLoginDto } from './dto/auth-login.dto';
import { EmailService } from '../email/email.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthSendEmailToConfirmAccountDto } from './dto/auth-send-email-to-confirm-account.dto';
import { CLIENT_URL } from '../constants';
import { User } from 'src/users/entities/user.entity';
import { AuthLoginInterfaceReturn } from './interfaces/auth-login-return';
import * as bcrypt from 'bcrypt';
import { AuthVerifyPassport } from './dto/auth-verify-password.dto';
import { Request, Response } from 'express';
import { jwtConstants } from './constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private PRIVATE_KEY_CLIENT =
    this.configService.get<string>('SECRET_KEY_CLIENT');

  // private
  private async authDtoLoginUser(user: User) {
    // if user not exists
    if (!user?.id) {
      throw new BadRequestException('usuário não encontrado!');
    }
    // if status of user not is CREATED
    if (user.status !== 'ACTIVATED') {
      throw new BadRequestException(
        'usuário não tem permissão para fazer o login!',
      );
    }
  }

  // public

  async login(
    data: AuthLoginDto,
    response: Response,
  ): Promise<AuthLoginInterfaceReturn> {
    const { email, password } = data;

    // get user
    const user = await this.usersService.findByEmail(email);

    // verify user
    if (!user?.id || user?.email !== email) {
      throw new BadRequestException('usuário não encontrado');
    }

    // auth data of user
    await this.authDtoLoginUser(user);

    // compare passwords
    const compare: boolean = await bcrypt.compare(password, user.password);
    if (!compare) {
      throw new UnauthorizedException('senha incorreta');
    }

    const { id } = user;
    const dataJwt = { id, email };

    const access_token = await this.jwtService.signAsync(dataJwt, {
      expiresIn: jwtConstants.tokenExpiration,
    });

    const refresh_token = await this.jwtService.signAsync(dataJwt, {
      expiresIn: jwtConstants.refreshTokenExpiration,
    });

    const dataUser: Partial<User> = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
    // this information is diferent.
    const session = await this.jwtService.signAsync(dataUser, {
      secret: this.PRIVATE_KEY_CLIENT,
    });

    // set cookies

    response.cookie('access_token', access_token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    response.cookie('session', session, {
      path: '/',
    });

    return {
      access_token,
      refresh_token,
    };
  }

  // refresh token

  async refreshToken(req: Request, res: Response) {
    const refresh = req.cookies.refresh_token || null;

    // if refresh is null
    if (!refresh) {
      throw new BadRequestException('não foi possivel fazer o refresh');
    }

    try {
      // verify refresh token
      const { id, email }: User = await this.jwtService.verifyAsync(refresh);
      // create new token
      const token = await this.jwtService.signAsync(
        { id, email },
        {
          expiresIn: jwtConstants.tokenExpiration,
        },
      );

      res.cookie('access_token', token);

      return {
        error: false,
        message: 'passport atualizado com sucesso!',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException('houve um erro ao tentar decode');
    }
  }

  // send email to user

  async sendEmailToConfirmAccount(
    data: AuthSendEmailToConfirmAccountDto,
  ): Promise<{ error: false; message: string }> {
    // verify user
    const user = await this.usersService.findByEmail(data.email);

    // verify user exists
    if (!user?.id) throw new BadRequestException('Usuário não encontrado!');

    //test
    if (user.status !== 'CREATED')
      throw new BadRequestException('Usuário não pode ser verificado!');

    //  try send email
    try {
      // create jwt for send email
      const code = this.jwtService.sign(
        { id: user.id, email: data.email },
        { expiresIn: '5m' },
      );

      // send email
      await this.emailService.sendEmail({
        to: data.email,
        html: `<a href="${CLIENT_URL}/confirm-email/${code}">Confirmar email</a>`,
      });

      // return response
      return {
        error: false,
        message: 'Email enviado com sucesso!',
      };
    } catch (error) {
      throw new BadRequestException('Houve um erro ao tentar enviar email');
    }
  }

  // confirm jwt of request and update user

  async confirmEmail(
    jwt: string,
  ): Promise<{ error: boolean; message: string }> {
    // decode
    const decode: { email: string; id: string } =
      (await this.jwtService.verifyAsync(jwt)) || { email: null, id: null };

    //verify decode
    if (!decode.email) {
      throw new BadRequestException('houve um erro!');
    }

    const { email, id } = decode;

    // get user of database
    const user = (await this.usersService.findByEmail(email)) || null;

    // verify user
    await this.authDtoConfirmEmail(user);

    // update to activated
    await this.usersService.update(id, { status: 'ACTIVATED' });

    return {
      error: false,
      message: 'usuário verificado!',
    };
  }

  // auth jwt

  async verifyJwt({ access_token }: AuthVerifyPassport): Promise<boolean> {
    return !!(await this.jwtService.verifyAsync(access_token));
  }

  // privates methods

  private async authDtoConfirmEmail(user: User) {
    // if user not exists
    if (!user?.id) {
      throw new BadRequestException('usuário não encontrado!');
    }
    // if status of user not is CREATED
    if (user.status !== 'CREATED') {
      throw new BadRequestException('usuário não pode ser verificado!');
    }
  }
}
