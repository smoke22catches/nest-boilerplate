import { PickType } from '@nestjs/swagger';
import UserDto from './user.dto';

export default class CreateUserDto extends PickType(UserDto, [
  'email',
  'password',
] as const) {}
