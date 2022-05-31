import { CommonEntity } from 'src/common/entities/common.entity';
import { Column, Entity } from 'typeorm';

enum status {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  BLOCKED = 'BLOCKED',
}

@Entity()
export class User extends CommonEntity {
  @Column()
  email: string;
  @Column()
  phoneNumber: string;
  @Column()
  password: string;
  @Column({ default: status.PENDING })
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
