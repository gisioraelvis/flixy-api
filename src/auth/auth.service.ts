import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { ForgotPasswordDto, SignUpDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { EmailConfirmationService } from './emailConfirmation.service';
import { EmailPasswordResetService } from './emailPasswordReset.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  //inject UserService
  constructor(
    private readonly userService: UserService,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly jwtService: JwtService,
    private readonly emailPasswordResetService: EmailPasswordResetService,
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

    // Send an email to the user with a link to confirm their email
    await this.emailConfirmationService.sendVerificationLink(signUpDto.email);

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

  /**
   * Sends user email with a link to reset their password
   * @param email - user email
   * @returns {Promise<any>} - success message or error message
   */

  async forgotPassword(email: string): Promise<any> {
    await this.userService.findOne(email);
    return await this.emailPasswordResetService.sendResetLink(email);
  }

  /**
   * Verify token from password reset link and update password
   * @param token - token from email
   * @param password - new password
   * @returns {Promise<user | any>}  - Updated user or error message
   */
  async resetPassword(token: string, password: string): Promise<User | any> {
    const user = await this.emailPasswordResetService.decodePasswordResetToken(
      token,
    );
    return await this.userService.updatePassword(user.email, password);
  }
}
