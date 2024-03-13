import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

jest.mock('@nestjs/jwt');

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflectorMock: jest.Mocked<Reflector>;
  let jwtServiceMock: jest.Mocked<JwtService>;

  beforeEach(async () => {
    reflectorMock = {
      getAllAndOverride: jest.fn(),
    } as any;

    jwtServiceMock = {
      verifyAsync: jest.fn(),
    } as any;

    jwtServiceMock = new JwtService() as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: Reflector, useValue: reflectorMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access to public routes', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(true);

    const contextMock: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer public_token' },
        }),
      }),
      getHandler: () => null,
      getClass: () => null,
    } as any;

    const result = await guard.canActivate(contextMock);

    expect(result).toBe(true);
    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledTimes(1);
    expect(reflectorMock.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      null,
      null,
    ]);
  });

  it('should throw UnauthorizedException for missing token', async () => {
    const contextMock: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
      getHandler: () => null,
      getClass: () => null,
    } as any;

    await expect(guard.canActivate(contextMock)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    const contextMock: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer invalid_token' },
        }),
      }),
      getHandler: () => null,
      getClass: () => null,
    } as any;

    jest
      .spyOn(guard as any, 'extractTokenFromHeader')
      .mockReturnValue('invalid_token');
    jest
      .spyOn(guard['jwtService'], 'verifyAsync')
      .mockRejectedValueOnce(new Error());

    await expect(guard.canActivate(contextMock)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should set user in request for valid token', async () => {
    const requestMock = {
      headers: { authorization: 'Bearer valid_token' },
      user: null,
    };

    const contextMock: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => requestMock,
      }),
      getHandler: () => null,
      getClass: () => null,
    } as any;

    jest
      .spyOn(jwtServiceMock, 'verifyAsync')
      .mockResolvedValueOnce({ userId: 1 });

    await guard.canActivate(contextMock);

    expect(requestMock.user).toEqual({ userId: 1 });
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid_token');
  });
});
