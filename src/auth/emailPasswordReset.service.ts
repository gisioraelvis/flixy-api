import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import VerificationTokenPayload from './verificationTokenPayload.interface';
import { MailerService } from '@nestjs-modules/mailer';
import { UserService } from '../user/user.service';
import { EMAIL_PASSWORD_RESET_URL } from 'src/common/constants';

@Injectable()
export class EmailPasswordResetService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly userService: UserService,
  ) {}

  /**
   * Sends email with confirmation link and token as query param
   * @param email - User email
   * @returns {Promise<any>} - Sent email status or error message
   */
  public sendResetLink(email: string): Promise<any> {
    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_EMAIL_VERIFICATION'),
      expiresIn: `${this.configService.get(
        'JWT_EMAIL_VERIFICATION_EXPIRES_IN',
      )}s`,
    });

    // Password reset link endpoint with jwt token as query param
    const url = `${EMAIL_PASSWORD_RESET_URL}?token=${token}`;

    // Email body
    const html = `<p>To reset your password , 
                     click or copy paste the link on your browser: <a href="${url}">${url}</a>
                  </p>`;

    // Send email
    return this.mailerService.sendMail({
      to: email,
      from: 'Flixy Password Reset <no-reply@flixy.com>',
      subject: 'Password Reset',
      html,
    });
  }

  /**
   * Verifies token from the password reset link
   * @param token - Token from password reset link
   * @returns {Promise<any>} - User email or error message
   */
  public async decodePasswordResetToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_EMAIL_VERIFICATION'),
      });

      if (typeof payload === 'object' && 'email' in payload) {
        const email = payload.email;
        return await this.userService.findOne(email);
      }

      // If payload is not an object or doesn't contain email
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'Password reset link expired, request a new one',
        );
      }
      throw new BadRequestException('Invalid email confirmation token');
    }
  }
}
