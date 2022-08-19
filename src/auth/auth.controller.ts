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
import SmsService from './phoneNumberConfirmation.service';

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
    return await this.emailConfirmationService.decodeConfirmationToken(
      emailConfirmationDto.token,
    );
  }

  // Receives request to resend email confirmation link, user must be signed in
  @Get('resend-email-confirmation-link')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async resendConfirmationLink(@Req() req: RequestWithUser) {
    return await this.emailConfirmationService.resendConfirmationLink(
      req.user.email,
    );
  }

  // User signin with email and password
  @Post('signin')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  signIn(@Req() req: RequestWithUser) {
    return this.authService.signIn(req.user);
  }

  // TODO: implement a proper User Profile endpoint
  // User profile
  @Get('user-profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  // request to send password reset link to user
  @Post('request-password-reset')
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
    return this.authService.resetPassword(token, resetPasswordDto.newpassword);
  }

  // Phone number confirmation via sms
  // User must be signed in
  @Get('initiate-phoneNumber-confirmation')
  @UseGuards(JwtAuthGuard)
  async initiatePhoneNumberConfirmation(@Req() request: RequestWithUser) {
    if (request.user.isPhoneNumberConfirmed) {
      throw new BadRequestException('Phone number is already confirmed');
    }
    await this.smsService.phoneNumberConfirmation(request.user.phoneNumber);
  }

  // confirm phone number
  // User must be signed in
  @Post('confirm-phoneNumber')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async checkVerificationCode(
    @Req() req: RequestWithUser,
    @Body() smsVerificationCodeDto: SmsVerificationCodeDto,
  ) {
    if (req.user.isPhoneNumberConfirmed) {
      throw new BadRequestException('Phone number is already confirmed');
    }
    await this.smsService.confirmPhoneNumber(
      req.user.email,
      req.user.phoneNumber,
      smsVerificationCodeDto.code,
    );
  }
}
