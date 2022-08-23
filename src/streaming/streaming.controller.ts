import {
  Req,
  Res,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { CreateOnDiskStreamDto } from './dto/create-streaming.dto';

@Controller('video-stream')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  // streams movie trailer video file from S3
  @Get('s3/trailer/:trailerKey')
  @UseGuards(JwtAuthGuard)
  async streamS3MovieTrailer(
    @Req() req: RequestWithUser,
    @Param('trailerKey') trailerKey: string,
    @Res() res: Response,
  ) {
    return this.streamingService.s3TrailerStream(trailerKey, req, res);
  }

  // streams movie video file from s3
  @Get('s3/video/:videoKey')
  @UseGuards(JwtAuthGuard)
  async streamS3MovieVideo(
    @Req() req: RequestWithUser,
    @Param('videoKey') videoKey: string,
    @Res() res: Response,
  ) {
    return this.streamingService.s3VideoStream(videoKey, req, res);
  }

  // gets a file stream stored on the local disk
  @Get('on-disk')
  @UseGuards(JwtAuthGuard)
  async streamOnDiskFile(
    @Req() req: RequestWithUser,
    @Query() createOnDiskStreamDto: CreateOnDiskStreamDto,
    @Res() res: Response,
  ) {
    const { filePath } = createOnDiskStreamDto;
    return this.streamingService.onDiskFileStream(filePath, req, res);
  }
}
