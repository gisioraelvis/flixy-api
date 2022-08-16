import { Req, Res, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import RequestWithUser from 'src/auth/requestWithUser.interface';

@Controller('video-stream')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Get(':videoKey')
  @UseGuards(JwtAuthGuard)
  async getPrivateMovieFile(
    @Req() req: RequestWithUser,
    @Param('videoKey') videoKey: string,
    @Res() res: Response,
  ) {
    return this.streamingService.fileStream(videoKey, req, res);
  }
}
