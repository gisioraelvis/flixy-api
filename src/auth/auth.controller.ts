import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { SmsVerificationCodeDto } from 'src/sms/createSms.dto';
import { AuthService } from './auth.service';
import {
  EmailConfirmationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignUpDto,
} from './dto/create-auth.dto';
import { EmailConfirmationService } from './emailConfirmation.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import RequestWithUser from './requestWithUser.interface';
import SmsService from './smsVerification.service';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly smsService: SmsService,
  ) {}

  // New user registration
  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  // Receives token from email confirmation link
  @Get('confirm-email')
  async confirm(@Query() emailConfirmationDto: EmailConfirmationDto) {
    await this.emailConfirmationService.decodeConfirmationToken(
      emailConfirmationDto.token,
    );
  }

  // Receives request to resend email confirmation link, user must be signed in
  @Post('resend-email-confirmation-link')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async resendConfirmationLink(@Req() req: RequestWithUser) {
    await this.emailConfirmationService.resendConfirmationLink(req.user.email);
  }

  // User signin with email and password
  @Post('signin')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  signIn(@Req() req: RequestWithUser) {
    console.log(req.user);
    return this.authService.signIn(req.user);
  }

  // User profile
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  // Reset password
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  // Reset password
  @Post('reset-password')
  resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    console.log(token);
    return this.authService.resetPassword(token, resetPasswordDto.newpassword);
  }

  // Phone number verification via sms
  // User must be signed in
  @Get('initiate-phonenumber-verification')
  @UseGuards(JwtAuthGuard)
  async initiatePhoneNumberVerification(@Req() request: RequestWithUser) {
    if (request.user.isPhoneNumberConfirmed) {
      throw new BadRequestException('Phone number is already verified');
    }
    await this.smsService.initiatePhoneNumberVerification(
      request.user.phoneNumber,
    );
  }

  // Verify phone number
  // User must be signed in
  @Post('phonenumber-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async checkVerificationCode(
    @Req() req: RequestWithUser,
    @Body() smsVerificationCodeDto: SmsVerificationCodeDto,
  ) {
    if (req.user.isPhoneNumberConfirmed) {
      throw new BadRequestException('Phone number is already verified');
    }
    await this.smsService.confirmPhoneNumber(
      req.user.email,
      req.user.phoneNumber,
      smsVerificationCodeDto.code,
    );
  }
}
