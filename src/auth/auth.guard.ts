import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Next,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../constants';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // verify if public route
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const cookies = request?.cookies;

    if (!cookies?.access_token || !cookies?.refresh_token) {
      throw new UnauthorizedException();
    }

    const { access_token } = cookies;

    try {
      const payload = await this.jwtService.verifyAsync(access_token);
      request.user = payload;
    } catch (err) {
      throw new UnauthorizedException({
        message: 'houve um erro ao tentar autenticar usuário',
      });
    }

    return true;
  }
}
