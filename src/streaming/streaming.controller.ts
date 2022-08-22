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
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';
import RequestWithUser from 'src/authentication/requestWithUser.interface';
import { CreateOnDiskStreamDto } from './dto/create-streaming.dto';

@Controller('video-stream')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  // gets a file stream stored on s3
  @Get('s3/:videoKey')
  @UseGuards(JwtAuthGuard)
  async streamS3PrivateFile(
    @Req() req: RequestWithUser,
    @Param('videoKey') videoKey: string,
    @Res() res: Response,
  ) {
    return this.streamingService.s3FileStream(videoKey, req, res);
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
