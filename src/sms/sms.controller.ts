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

  @Post('send-sms')
  @HttpCode(200)
  async sendSms(@Body() smsDto: SmsDto) {
    await this.smsService.sendMessage(
      smsDto.receiverPhoneNumber,
      smsDto.message,
    );
  }
}
