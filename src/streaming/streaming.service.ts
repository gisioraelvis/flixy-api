import {
  Injectable,
  StreamableFile,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { statSync, createReadStream } from 'fs';
import { join } from 'path';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { PrivateFileService } from 'src/s3-private-file/private-file.service';
import { PublicFileService } from 'src/s3-public-file/public-file.service';

@Injectable()
export class StreamingService {
  constructor(
    private readonly privateFileService: PrivateFileService,
    private readonly publicFileService: PublicFileService,
  ) {}

  /**
   * Streams a trailer movie video file from S3.
   * @param fileKey - The key of the trailer file to stream
   * @param req - The request object
   * @param res - The response object
   */
  async s3TrailerStream(fileKey: string, req: RequestWithUser, res: Response) {
    try {
      const fileStream = await this.publicFileService.getMovieFile(fileKey);

      //console.log(req.user);

      fileStream.pipe(res);
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  /**
   * Streams a private video movie file from S3.
   * @param fileKey - The key of the video file to stream
   * @param req - The request object
   * @param res - The response object
   */
  async s3VideoStream(fileKey: string, req: RequestWithUser, res: Response) {
    try {
      const fileStream = await this.privateFileService.getMovieFile(fileKey);

      //console.log(req.user);

      fileStream.pipe(res);
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  /**
   * Streams a file stored on the local disk.
   * @param filePath - The path of the file to stream
   * @param req
   * @param res
   *
   * @see https://www.smashingmagazine.com/2021/04/building-video-streaming-app-nuxtjs-node-express/#streaming-the-videos
   */
  async onDiskFileStream(
    filePath: string,
    req: RequestWithUser,
    res: Response,
  ) {
    try {
      const file = join(process.cwd(), filePath);
      const fileSize = statSync(file).size;

      // TODO: Dynamically set the content-type
      // const contentType = mime.getType(file);

      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        const fileStream = createReadStream(file, { start, end });
        fileStream.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        const fileStream = createReadStream(filePath);
        return new StreamableFile(fileStream);
      }
    } catch (e) {
      throw new InternalServerErrorException(
        `Error streaming file from disk: ${e.message}`,
      );
    }
  }
}
