import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  // Using the AuthService validate the user with email and password
  async validate(email: string, password: string): Promise<any> {
    // If validation is successful populate the user object into the request object
    return await this.authService.validateUser(email, password);
  }
}
