import { CommonEntity } from 'src/common/entities/common.entity';
import { BeforeInsert, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcrypt';

enum status {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  BLOCKED = 'BLOCKED',
}

@Entity()
export class User extends CommonEntity {
  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  password: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @Column({ enum: status, default: status.PENDING })
  status: status;

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
