import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { MpesaExpressService } from './mpesa-express.service';
import { MpesaExpressController } from './mpesa-express.controller';
import { MPesaOAuthMiddleware } from './mpesa-oauth.middleware';

@Module({
  controllers: [MpesaExpressController],
  providers: [MpesaExpressService],
})
export class MpesaExpressModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // TODO: restrict to mpesa express routes only
    consumer
      .apply(MPesaOAuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.GET });
  }
}
