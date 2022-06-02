import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

const EmailMessage = 'Email must be a valid email address';
export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: EmailMessage })
  email: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
