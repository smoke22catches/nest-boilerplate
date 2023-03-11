import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import CreateUserDto from './dto/create-user.dto';
import UserDto from './dto/user.dto';
import User from './entities/user.entity';

@Injectable()
export default class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /**
   * WARNING - doesn't hashing password
   * @param userData
   * @returns
   */
  async create(userData: CreateUserDto): Promise<UserDto> {
    const user = await this.userRepository.create(userData);
    await this.userRepository.save(user);
    return user;
  }

  async findOneByUuid(uuid: string) {
    return await this.userRepository.findOneOrFail({
      where: { uuid },
    });
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOneOrFail({
      where: { email },
    });
  }

  async setRefreshToken(userId: number, refreshToken: string) {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ refreshToken })
      .where('id = :userId', { userId })
      .execute();
  }
}
