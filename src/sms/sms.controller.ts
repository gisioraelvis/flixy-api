import {
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
  Post,
  Body,
  HttpCode,
} from '@nestjs/common';
import SmsService from './sms.service';
import { SmsDto } from './createSms.dto';

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
