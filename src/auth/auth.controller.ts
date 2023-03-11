import { Body, Controller, Post, UseGuards, Req, Res } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import UserDto from '../users/dto/user.dto';
import AuthService from './auth.service';
import SignuUpDto from './dto/sign-up.dto';
import LocalAuthGuard from './guards/local-auth.guard';
import { RequestWithUser } from './interfaces/request-with-user';
import SignInDto from './dto/sign-in.dto';
import JwtRefreshGuard from './guards/jwt-refresh.guard';

@ApiTags('Auth')
@Controller('auth')
export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiExtraModels(UserDto)
  @ApiCreatedResponse({
    schema: {
      $ref: getSchemaPath(UserDto),
    },
  })
  @Post('signup')
  async signUp(@Body() signUpData: SignuUpDto, @Res() res: Response) {
    let user = await this.authService.signUp(signUpData);
    const { staySignedIn } = signUpData;
    await this.attachTokenCookiesToResponse(res, user, staySignedIn);
    user = plainToInstance(UserDto, user, {
      strategy: 'excludeAll',
    });
    res.send(user);
  }

  @ApiExtraModels(UserDto)
  @ApiCreatedResponse({
    schema: {
      $ref: getSchemaPath(UserDto),
    },
  })
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signIn(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Body() signInData: SignInDto,
  ) {
    let user = req.user;
    const { staySignedIn } = signInData;
    await this.attachTokenCookiesToResponse(res, user, staySignedIn);
    user = plainToInstance(UserDto, user, { strategy: 'excludeAll' });
    res.send(user);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshingAccessToken(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const { cookie } = await this.authService.getAccessTokenForUser(req.user);
    res.setHeader('Set-Cookie', cookie);
  }

  private async attachTokenCookiesToResponse(
    res: Response,
    user: UserDto,
    staySignedIn: boolean,
  ) {
    const { cookie: accessCookie } =
      await this.authService.getAccessTokenForUser(user);
    const { cookie: refreshCookie, token: refreshToken } =
      await this.authService.getRefreshTokenForUser(user, staySignedIn);

    await this.authService.hashAndSaveRefreshTokenForUser(
      user.id,
      refreshToken,
    );

    res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
  }
}
