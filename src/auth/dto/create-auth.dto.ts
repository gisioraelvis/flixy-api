import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

const EmailMessage = 'Email must be a valid email address';
export class SignUpDto {
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

export class SignInDto {
  @IsNotEmpty()
  @IsEmail({}, { message: EmailMessage })
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail({}, { message: EmailMessage })
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class EmailConfirmationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
