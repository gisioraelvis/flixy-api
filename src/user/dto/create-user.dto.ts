import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

const EmailMessage = 'Email must be a valid email address';
export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: EmailMessage })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must start with country code e.g. +254',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  isContentCreator: boolean;
}
