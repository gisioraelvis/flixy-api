import { MailerService } from '@nestjs-modules/mailer';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('emails')
export class EmailController {
  constructor(private mailService: MailerService) {}

  @Get('test')
  async plainTextEmail(@Query('toEmail') toEmail: any) {
    const response = await this.mailService.sendMail({
      to: toEmail,
      from: 'Flixy <no-reply@flixy.com>',
      subject: 'Test email 🚀 ',
      template: 'testEmail',
    });
    return response;
  }
}
