import { Module } from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { StreamingController } from './streaming.controller';
import { PrivateFileModule } from 'src/s3-private-files/private-files.module';
import { PrivateFileService } from 'src/s3-private-files/private-files.service';

@Module({
  imports: [PrivateFileModule],
  controllers: [StreamingController],
  providers: [StreamingService, PrivateFileService],
})
export class StreamingModule {}
