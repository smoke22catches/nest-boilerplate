import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import validator from 'validator';
import UserDto from '../../users/dto/user.dto';
import AuthService from '../auth.service';

@Injectable()
export default class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<UserDto> {
    if (!validator.isEmail(email) || validator.isEmpty(password)) {
      throw new BadRequestException();
    }

    return await this.authService.validateUser(email, password);
  }
}
