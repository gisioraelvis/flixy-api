import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { PrivateFileService } from 'src/s3-private-files/private-files.service';

@Injectable()
export class StreamingService {
  constructor(private readonly privateFileService: PrivateFileService) {}

  /**
   * Streams a private movie file from S3.
   * @param fileKey - The key of the file to stream
   * @param req - The request object
   * @param res - The response object
   */
  async fileStream(fileKey: string, req: RequestWithUser, res: Response) {
    const fileStream = await this.privateFileService.getMovieFile(fileKey);

    console.log(req.user);
    try {
      fileStream.pipe(res);
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }
}
