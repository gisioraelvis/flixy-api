import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, SignInDto, SignUpDto } from './dto/create-auth.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('/signin')
  @HttpCode(200)
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('/forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }
}
