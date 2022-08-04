import { CommonEntity } from 'src/common/entities/common.entity';
import { Exclude } from 'class-transformer';
import PrivateFile from 'src/s3-private-files/entities/private-file.entity';

export enum UserAccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class User extends CommonEntity {
  email: string;
  isEmailConfirmed: boolean;
  phoneNumber: string;
  isPhoneNumberConfirmed: boolean;
  @Exclude()
  password: string;
  status: UserAccountStatus;
  isAdult: boolean;
  isAdmin: boolean;
  isContentCreator: boolean;
  public files: PrivateFile[];
}
