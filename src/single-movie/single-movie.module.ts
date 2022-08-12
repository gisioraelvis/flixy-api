import { Module } from '@nestjs/common';
import { SingleMovieService } from './single-movie.service';
import { SingleMovieController } from './single-movie.controller';
import { PublicFileModule } from 'src/s3-public-files/public-files.module';
import { PrivateFileModule } from 'src/s3-private-files/private-files.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonModule } from 'src/common/common.module';
import { PrivateFileService } from 'src/s3-private-files/private-files.service';
import { PublicFilesService } from 'src/s3-public-files/public-files.service';

@Module({
  imports: [CommonModule, PublicFileModule, PrivateFileModule],
  controllers: [SingleMovieController],
  providers: [
    SingleMovieService,
    PrismaService,
    PrivateFileService,
    PublicFilesService,
  ],
})
export class SingleMovieModule {}
