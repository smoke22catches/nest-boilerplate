import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as cookieParser from 'cookie';
import PostgresErrorCode from '../database/enums/postgres-error-codes.enum';
import UserDto from '../users/dto/user.dto';
import UsersService from '../users/users.service';
import SignuUpDto from './dto/sign-up.dto';
import TokenPayload from './interfaces/token-payload';

@Injectable()
export default class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async signUp(signUpData: SignuUpDto): Promise<UserDto> {
    const hashedPassword = await this.hash(signUpData.password);

    try {
      const user = await this.usersService.create({
        ...signUpData,
        password: hashedPassword,
      });
      return user;
    } catch (err) {
      if (err?.code == PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException('User with that email already exists.');
      }

      throw new InternalServerErrorException();
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.getUser(email);
    const passwordVerified = await this.verifyHashedValue(
      user.password,
      password,
    );

    if (!passwordVerified) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async getUser(email: string): Promise<UserDto> {
    try {
      return await this.usersService.findOneByEmail(email);
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException();
    }
  }

  async getAccessTokenForUser(user: UserDto) {
    const payload: TokenPayload = { uuid: user.uuid, sub: user.id };
    const secret = this.configService.get('ACCESS_TOKEN_SECRET');
    const expiresIn = this.configService.get<number>(
      'ACCESS_TOKEN_EXPIRES_IN_SECONDS',
    );
    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    const cookieName = this.configService.get('ACCESS_TOKEN_COOKIE_NAME');
    const cookieOptions: Record<string, any> = {
      httpOnly: true,
      maxAge: new Date(expiresIn * 1000),
    };

    const cookie = cookieParser.serialize(cookieName, token, cookieOptions);
    return { token, cookie };
  }

  async getRefreshTokenForUser(user: UserDto, staySignedIn: boolean) {
    const payload: TokenPayload = { uuid: user.uuid, sub: user.id };
    const secret = this.configService.get('REFRESH_TOKEN_SECRET');
    const expiresIn = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRES_IN_SECONDS',
    );
    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    const cookieName = this.configService.get('REFRESH_TOKEN_COOKIE_NAME');
    const cookieOptions: Record<string, any> = {
      httpOnly: true,
    };

    if (staySignedIn) {
      cookieOptions.maxAge = new Date(expiresIn * 1000);
    }

    const cookie = cookieParser.serialize(cookieName, token, cookieOptions);
    return { token, cookie };
  }

  async hashAndSaveRefreshTokenForUser(userId: number, token: string) {
    const hashedToken = await this.hash(token);
    await this.usersService.setRefreshToken(userId, hashedToken);
  }

  async validateRefreshToken(
    refreshToken: string,
    user: UserDto,
  ): Promise<boolean> {
    return await this.verifyHashedValue(user.refreshToken, refreshToken);
  }

  private async hash(value: string): Promise<string> {
    try {
      return await argon2.hash(value);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  private async verifyHashedValue(
    hashedValue: string,
    originalValue: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedValue, originalValue);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }
}
