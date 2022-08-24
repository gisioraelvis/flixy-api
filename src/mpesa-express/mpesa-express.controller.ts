import {
  Req,
  Get,
  Post,
  Param,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MpesaExpressService } from './mpesa-express.service';
import RequestWithMPesaOAuthToken from './mpesa-oauth-token-request.interface';
import { Request } from 'express';

@Controller('mpesa-express')
export class MpesaExpressController {
  constructor(private readonly mpesaExpressService: MpesaExpressService) {}

  @Get('single-movie/:singleMovieId')
  @UseGuards(JwtAuthGuard)
  payForPremieringSingleMovie(
    @Param('singleMovieId', ParseIntPipe) singleMovieId: number,
    @Req() req: RequestWithMPesaOAuthToken,
  ) {
    return this.mpesaExpressService.pay(singleMovieId, req);
  }

  @Post('single-movie/callback')
  callbackForPremieringSingleMovie(@Req() req: Request) {
    return this.mpesaExpressService.callback(req);
  }
}
