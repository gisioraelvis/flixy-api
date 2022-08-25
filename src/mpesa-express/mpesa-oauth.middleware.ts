import { ConfigService } from '@nestjs/config';
import {
  Injectable,
  NestMiddleware,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import RequestWithToken from './mpesa-oauth-token-request.interface';
import axios from 'axios';

@Injectable()
export class MPesaOAuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  async use(req: RequestWithToken, res: Response, next: NextFunction) {
    const consumerKey = this.configService.get('MPESA_EXPRESS_CONSUMER_KEY');

    const consumerSecret = this.configService.get(
      'MPESA_EXPRESS_CONSUMER_SECRET',
    );

    const oauthEndpoint = this.configService.get('MPESA_OAUTH_ENDPOINT');

    // Buffer of the consumer key:secret
    const buffer = Buffer.from(`${consumerKey}:${consumerSecret}`);
    const auth = `Basic ${buffer.toString('base64')}`;

    try {
      const { data } = await axios.get(oauthEndpoint, {
        headers: {
          Authorization: auth,
        },
      });

      console.log('--------------MPesaOAuthMiddleware---------------------');
      console.log(`MPESA_OAUTH_TOKEN: ${data.access_token}`);

      // Get the Oauth access token from the response data object and set it in the request object
      req.mPesaOAuthToken = data['access_token'];

      next();
    } catch (err) {
      throw new InternalServerErrorException(
        `Error getting M-Pesa OAuth token: ${err['response']['statusText']}`,
      );
    }
  }
}
