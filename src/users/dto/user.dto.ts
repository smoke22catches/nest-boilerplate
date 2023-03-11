import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export default class UserDto {
  @Exclude()
  id: number;

  @ApiProperty()
  @IsUUID(4)
  @Expose()
  uuid: string;

  @ApiProperty()
  @IsEmail()
  @Expose()
  email: string;

  @IsNotEmpty()
  @Exclude()
  password: string;

  @Exclude()
  refreshToken: string;
}
