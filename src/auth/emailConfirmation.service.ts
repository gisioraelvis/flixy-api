import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import VerificationTokenPayload from './verificationTokenPayload.interface';
import { MailerService } from '@nestjs-modules/mailer';
import { UserService } from '../user/user.service';
import { EMAIL_CONFIRMATION_URL } from 'src/common/constants';

@Injectable()
export class EmailConfirmationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly userService: UserService,
  ) {}

  /**
   * Sends email with confirmation link and token as query param
   * @param email - User email
   */
  public sendVerificationLink(email: string) {
    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_EMAIL_VERIFICATION'),
      expiresIn: `${this.configService.get(
        'JWT_EMAIL_VERIFICATION_EXPIRES_IN',
      )}s`,
    });

    // Email confirmation link endpoint with jwt token as query param
    const url = `${EMAIL_CONFIRMATION_URL}?token=${token}`;

    // Email body
    const html = `<p>Welcome to Flixy.</p>
                  <p>
                  To confirm your email address, 
                  click or copy paste the link on your browser: <a href="${url}">${url}</a>
                  </p>`;

    // Send email
    return this.mailerService.sendMail({
      to: email,
      from: 'Flixy New SignUp <no-reply@flixy.com>',
      subject: 'Email confirmation',
      html,
    });
  }

  /**
   * Checks and updates email confirmation status
   * @param email - User email
   */
  public async confirmEmail(email: string) {
    const user = await this.userService.findOne(email);
    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email already confirmed');
    }
    await this.userService.markEmailAsConfirmed(email);
  }

  /**
   * Verifies email confirmation token
   * @param token - Token from confirmation email
   */
  public async decodeConfirmationToken(token: string) {
    let userEmail: string;
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_EMAIL_VERIFICATION'),
      });

      if (typeof payload === 'object' && 'email' in payload) {
        const email = payload.email;
        return await this.confirmEmail(email);
      }
      // If payload is not an object or doesn't contain email
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        console.log(userEmail);
        throw new BadRequestException('Email confirmation token expired');
      }
      throw new BadRequestException('Invalid email confirmation token');
    }
  }

  /**
   * Resend email confirmation link e.g In cases where:
   * initial link was not received or expired
   * @param email
   * @returns {Promise<any>} - Sent email status or error message
   */
  public async resendConfirmationLink(email: string): Promise<any> {
    const user = await this.userService.findOne(email);
    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email already confirmed');
    }
    return await this.sendVerificationLink(user.email);
  }
}
