import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import UsersService from '../../users/users.service';
import AuthService from '../auth.service';
import TokenPayload from '../interfaces/token-payload';

@Injectable()
export default class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private cookieName: string;

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    const cookieName = configService.get('REFRESH_TOKEN_COOKIE_NAME');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies[cookieName];
        },
      ]),
      secretOrKey: configService.get('REFRESH_TOKEN_SECRET'),
    });
    this.cookieName = cookieName;
  }

  async validate(request: Request, payload: TokenPayload) {
    const user = await this.usersService.findOneByUuid(payload.uuid);
    const refreshToken = request.cookies[this.cookieName];
    const unauthorizedException = new UnauthorizedException();

    if (refreshToken) {
      if (await this.authService.validateRefreshToken(refreshToken, user)) {
        return user;
      }

      throw unauthorizedException;
    }

    throw unauthorizedException;
  }
}
