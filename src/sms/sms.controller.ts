import {
  Controller,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Post,
  Req,
  BadRequestException,
  Body,
  HttpCode,
} from '@nestjs/common';
import SmsService from './sms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import RequestWithUser from '../auth/requestWithUser.interface';
import { SmsDto, SmsVerificationCodeDto } from './createSms.dto';

@Controller('sms')
@UseInterceptors(ClassSerializerInterceptor)
export default class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('initiate-phonenumber-verification')
  @UseGuards(JwtAuthGuard)
  async initiatePhoneNumberVerification(@Req() request: RequestWithUser) {
    if (request.user.isPhoneNumberConfirmed) {
      throw new BadRequestException('Phone number already confirmed');
    }
    await this.smsService.initiatePhoneNumberVerification(
      request.user.phoneNumber,
    );
  }

  @Post('phonenumber-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async checkVerificationCode(
    @Req() req: RequestWithUser,
    @Body() smsVerificationCodeDto: SmsVerificationCodeDto,
  ) {
    if (req.user.isPhoneNumberConfirmed) {
      throw new BadRequestException('Phone number already confirmed');
    }
    await this.smsService.confirmPhoneNumber(
      req.user.email,
      req.user.phoneNumber,
      smsVerificationCodeDto.code,
    );
  }

  @Post('send-sms')
  @HttpCode(200)
  async sendSms(@Body() smsDto: SmsDto) {
    await this.smsService.sendMessage(
      smsDto.receiverPhoneNumber,
      smsDto.message,
    );
  }
}
