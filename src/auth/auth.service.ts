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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

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

  async login(data: AuthLoginDto): Promise<AuthLoginInterfaceReturn> {
    const { email, password } = data;

    // get user
    const user = await this.usersService.findByEmail(email);

    // verify user
    if (!user) {
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
      expiresIn: '1m',
    });

    const refresh_token = await this.jwtService.signAsync(dataJwt, {
      expiresIn: '1h',
    });

    return {
      access_token,
      refresh_token,
    };
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
