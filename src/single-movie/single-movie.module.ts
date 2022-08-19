import { Module } from '@nestjs/common';
import { SingleMovieService } from './single-movie.service';
import { SingleMovieController } from './single-movie.controller';
import { PublicFileModule } from 'src/s3-public-file/public-file.module';
import { PrivateFileModule } from 'src/s3-private-file/private-file.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonModule } from 'src/common/common.module';
import { PrivateFileService } from 'src/s3-private-file/private-file.service';
import { PublicFileService } from 'src/s3-public-file/public-file.service';

@Module({
  imports: [CommonModule, PublicFileModule, PrivateFileModule],
  controllers: [SingleMovieController],
  providers: [
    SingleMovieService,
    PrismaService,
    PrivateFileService,
    PublicFileService,
  ],
})
export class SingleMovieModule {}
