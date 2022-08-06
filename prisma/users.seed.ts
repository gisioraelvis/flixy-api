import { PasswordService } from '../src/auth/passwordHashing.service';
import { faker } from '@faker-js/faker';

const hashPassword = new PasswordService().hashPassword;

enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// admin user
export const generateAdminUser = async () => ({
  email: 'admin@gmail.com',
  isEmailConfirmed: true,
  phoneNumber: '+2543456789',
  isPhoneNumberConfirmed: true,
  password: await hashPassword('admin'),
  status: UserStatus.ACTIVE,
  isAdmin: true,
  isContentCreator: true,
});

// generate random content creator users
export const generateContentCreators = Array.from({ length: 10 }).map(() => ({
  email: faker.internet.email(),
  isEmailConfirmed: true,
  phoneNumber: faker.phone.number('+254#########'),
  isPhoneNumberConfirmed: true,
  password: faker.internet.password(),
  status: UserStatus.ACTIVE,
  isAdmin: false,
  isContentCreator: true,
}));

// generate random users
export const generateUsers = Array.from({ length: 80 }).map(() => ({
  email: faker.internet.email(),
  isEmailConfirmed: true,
  phoneNumber: faker.phone.number('+254#########'),
  isPhoneNumberConfirmed: true,
  password: faker.internet.password(),
  status: UserStatus.ACTIVE,
  isAdmin: false,
  isContentCreator: false,
}));
