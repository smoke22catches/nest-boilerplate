import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import UserDto from '../dto/user.dto';

@Entity()
export default class User implements UserDto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 36 })
  uuid: string;

  @BeforeInsert()
  setUuid() {
    this.uuid = uuidv4();
  }

  @Column('varchar', { unique: true, length: 36 })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  refreshToken: string;
}
