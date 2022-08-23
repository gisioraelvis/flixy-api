import {
  Req,
  Res,
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
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
  @Get('s3/trailer')
  @UseGuards(JwtAuthGuard)
  async streamS3MovieTrailer(
    @Req() req: RequestWithUser,
    @Query('trailerKey') trailerKey: string,
    @Res() res: Response,
  ) {
    // if trailer key is not provided, return error
    if (!trailerKey) {
      throw new BadRequestException('trailerKey is required as query param');
    }
    return this.streamingService.s3TrailerStream(trailerKey, req, res);
  }

  // streams movie video file from s3
  @Get('s3/video')
  @UseGuards(JwtAuthGuard)
  async streamS3MovieVideo(
    @Req() req: RequestWithUser,
    @Query('videoKey') videoKey: string,
    @Res() res: Response,
  ) {
    // if video key is not provided, return error
    if (!videoKey) {
      throw new BadRequestException('videoKey is required as query param');
    }
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
