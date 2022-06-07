import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { UserService } from '../user/user.service';

@Injectable()
export default class SmsVerificationService {
  private twilioClient: Twilio;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const accountSid = configService.get('TWILIO_ACCOUNT_SID');
    const authToken = configService.get('TWILIO_AUTH_TOKEN');

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  /**
   * Iniate phone number verification process.
   * @param phoneNumber - User phone number to verify
   * @returns {Promise<any>} - Success or errors
   */
  initiatePhoneNumberVerification(phoneNumber: string): Promise<any> {
    const serviceSid = this.configService.get(
      'TWILIO_VERIFICATION_SERVICE_SID',
    );

    return this.twilioClient.verify
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });
  }

  /**
   * Confirms the User phone number using the sms received verification code
   * @param email - User email
   * @param phoneNumber - User phone nuumber to verify
   * @param verificationCode - sms received phone number
   * @returns {Promise<any>} - Success(marks phoneNumber verified) or errors
   */
  async confirmPhoneNumber(
    email: string,
    phoneNumber: string,
    verificationCode: string,
  ): Promise<any> {
    const serviceSid = this.configService.get(
      'TWILIO_VERIFICATION_SERVICE_SID',
    );

    const result = await this.twilioClient.verify
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code: verificationCode });

    if (!result.valid || result.status !== 'approved') {
      throw new BadRequestException('Provided verification code is invalid');
    }

    return await this.userService.markPhoneNumberConfirmed(email);
  }
}
