import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import SmsController from './sms.controller';
import SmsService from './sms.service';

@Module({
  imports: [UserModule],
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}
