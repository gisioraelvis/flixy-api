import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SmsVerificationCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class SmsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must start with country code e.g. +254',
  })
  receiverPhoneNumber: string;
  @IsString()
  @IsNotEmpty()
  message: string;
}
