import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import AuthController from './auth.controller';
import AuthService from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const user = {
    uuid: '57d7e194-5e40-405c-90be-a8d87d08face',
    email: 'example@mail.com',
  };
  const accessToken = 'accessToken';
  const accessCookie = 'accessCookie';
  const refreshToken = 'refreshToken';
  const refreshCookie = 'refreshCookie';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn().mockReturnValue(user),
            getAccessTokenForUser: jest.fn().mockReturnValue({
              cookie: accessCookie,
              token: accessToken,
            }),
            getRefreshTokenForUser: jest.fn().mockReturnValue({
              cookie: refreshCookie,
              token: refreshToken,
            }),
            hashAndSaveRefreshTokenForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /signup', () => {
    it('should register a user', async () => {
      const signUpData = {
        email: 'example@mail.com',
        password: 'Password_1',
        staySignedIn: true,
      };
      const responseMock = {
        send: jest.fn((x) => x),
        setHeader: jest.fn((header, cookie) => [header, cookie]),
      } as unknown as Response;
      await controller.signUp(signUpData, responseMock);
      expect(responseMock.send).toHaveBeenCalledWith(user);
      expect(responseMock.setHeader).toBeCalledWith('Set-Cookie', [
        accessCookie,
        refreshCookie,
      ]);
    });
  });
});
