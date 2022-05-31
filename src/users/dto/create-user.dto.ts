import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;
  @IsString()
  phoneNumber: string;
  @IsString()
  password: string;
}
