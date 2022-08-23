import { Module } from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { StreamingController } from './streaming.controller';
import { PrivateFileModule } from 'src/s3-private-file/private-file.module';
import { PrivateFileService } from 'src/s3-private-file/private-file.service';
import { PublicFileService } from 'src/s3-public-file/public-file.service';

@Module({
  imports: [PrivateFileModule],
  controllers: [StreamingController],
  providers: [StreamingService, PublicFileService, PrivateFileService],
})
export class StreamingModule {}
