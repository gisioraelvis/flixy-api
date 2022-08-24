import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

const EmailMessage = 'Email must be a valid email address';
export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: EmailMessage })
  email: string;

  @IsNotEmpty()
  @IsString()
  // 2547xxxxxxxx
  @Matches(/^2547[0-9]{8}$/, {
    message: 'Phone number must be a valid phone number',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  isContentCreator: boolean;
}
