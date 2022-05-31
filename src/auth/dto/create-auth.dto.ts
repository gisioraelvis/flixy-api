import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;
  @IsPhoneNumber()
  phonenumber: string;
  @IsString()
  password: string;
}

export class SignInDto {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
}

export class forgotPasswordDto {
  @IsEmail()
  email: string;
}
