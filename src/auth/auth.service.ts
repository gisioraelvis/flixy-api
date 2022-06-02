import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ForgotPasswordDto, SignInDto, SignUpDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  //inject UserService
  constructor(private readonly userService: UserService) {}

  async signUp(signUpDto: SignUpDto) {
    const newUser = await this.userService.create(signUpDto);
    return newUser;
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.userService.findOne(signInDto.email);
    const isValidPassword = user.password === signInDto.password;
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    await this.userService.findOne(forgotPasswordDto.email);
    return { message: 'Check your email for a link to reset your password' };
  }
}
