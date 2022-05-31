import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { forgotPasswordDto, SignInDto, SignUpDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  //inject UserService
  constructor(private readonly userService: UserService) {}
  signUp(signUpDto: SignUpDto) {
    return 'This action adds a new auth';
  }

  signIn(signInDto: SignInDto) {
    return 'This action adds a new auth';
  }

  forgotPassword(forgotPasswordDto: forgotPasswordDto) {
    return 'This action adds a new auth';
  }
}
