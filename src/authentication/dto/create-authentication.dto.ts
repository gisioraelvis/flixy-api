import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

const EmailMessage = 'Email must be a valid email address';
export class SignUpDto {
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

  // added to make signupDto compatible with createUserDto and hence updateUserDto
  isContentCreator: boolean;
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
  newpassword: string;
}

export class EmailConfirmationDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
