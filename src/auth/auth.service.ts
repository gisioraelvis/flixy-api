import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { forgotPasswordDto, SignInDto, SignUpDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  //inject UserService
  constructor(private readonly userService: User) {}
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
