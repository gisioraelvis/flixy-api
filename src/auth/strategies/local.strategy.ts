import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authenticationService: AuthenticationService) {
    super({ usernameField: 'email' });
  }

  // Using the AuthService validate the user with email and password
  async validate(email: string, password: string): Promise<any> {
    // If validation is successful populate the user object into the request object
    return await this.authenticationService.validateUser(email, password);
  }
}
