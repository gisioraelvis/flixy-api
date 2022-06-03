import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { ForgotPasswordDto, SignUpDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  //inject UserService
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registers a new user and returns a JWT token
   * @param signUpDto
   * @returns JWT token
   */
  async signUp(signUpDto: SignUpDto): Promise<any> {
    /**
     * Call the UserService from the UserModule
     * Does the necessary validations and creates a new user
     */
    const newUser = await this.userService.create(signUpDto);

    // Return the JWT token
    return this.signIn(newUser);
  }

  /**
   * Check if user with email exists and password is correct
   * @params email and password
   * @returns User object
   */
  async validateUser(email: string, password: string): Promise<any> {
    // Call the UserService from the UserModule
    const user = await this.userService.findOne(email);
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  /**
   * Sign in a user and return a JWT token
   * @param user
   * @returns JWT token
   */
  async signIn(user: any): Promise<any> {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    await this.userService.findOne(forgotPasswordDto.email);
    return { message: 'Check your email for a link to reset your password' };
  }
}
