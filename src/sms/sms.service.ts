import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export default class SmsService {
  private twilioClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = configService.get('TWILIO_ACCOUNT_SID');
    const authToken = configService.get('TWILIO_AUTH_TOKEN');

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  /**
   * Send an sms to a User
   * @param receiverPhoneNumber - User phoneNumber to send sms to
   * @param message - sms message
   * @returns {Promise<any>} - Success(MessageInstance) or errors
   */
  async sendMessage(
    receiverPhoneNumber: string,
    message: string,
  ): Promise<any> {
    const senderPhoneNumber = this.configService.get(
      'TWILIO_SENDER_PHONE_NUMBER',
    );

    return this.twilioClient.messages.create({
      body: message,
      from: senderPhoneNumber,
      to: receiverPhoneNumber,
    });
  }
}
