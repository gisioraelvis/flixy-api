import { CommonEntity } from 'src/common/entities/common.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

export enum UserAccountStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  BLOCKED = 'BLOCKED',
}

@Entity()
export class User extends CommonEntity {
  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ default: false })
  public isPhoneNumberConfirmed: boolean;

  @Column()
  @Exclude()
  password: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @Column({ enum: UserAccountStatus, default: UserAccountStatus.PENDING })
  status: UserAccountStatus;

  @Column({ default: null })
  googleId: string | null;

  @Column({ default: null })
  facebookId: string | null;

  @Column({ default: null })
  verificationToken: string | null;

  @Column({ default: true })
  isAdult: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isContentCreator: boolean;
}
