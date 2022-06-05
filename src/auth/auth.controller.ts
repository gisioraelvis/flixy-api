import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  EmailConfirmationDto,
  ForgotPasswordDto,
  SignUpDto,
} from './dto/create-auth.dto';
import { EmailConfirmationService } from './emailConfirmation.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import RequestWithUser from './requestWithUser.interface';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailConfirmationService: EmailConfirmationService,
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
  async resendConfirmationLink(@Request() req: RequestWithUser) {
    await this.emailConfirmationService.resendConfirmationLink(req.user.email);
  }

  // User login
  @Post('signin')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  signIn(@Request() req: RequestWithUser) {
    return this.authService.signIn(req.user);
  }

  // User profile
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  // Reset password
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }
}
