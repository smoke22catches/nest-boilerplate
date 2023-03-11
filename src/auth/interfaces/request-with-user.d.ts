import { Request } from '@nestjs/common';
import UserDto from '../users/dto/user.dto';

declare interface RequestWithUser extends Request {
  user: UserDto;
}
