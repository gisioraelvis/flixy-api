import { Module } from '@nestjs/common';
import { SeriesMovieService } from './series-movie.service';
import { SeriesMovieController } from './series-movie.controller';
import { CommonModule } from 'src/common/common.module';
import { PrivateFileModule } from 'src/s3-private-files/private-files.module';
import { PublicFileModule } from 'src/s3-public-files/public-files.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrivateFileService } from 'src/s3-private-files/private-files.service';
import { PublicFilesService } from 'src/s3-public-files/public-files.service';

@Module({
  imports: [CommonModule, PublicFileModule, PrivateFileModule],
  controllers: [SeriesMovieController],
  providers: [
    SeriesMovieService,
    PrismaService,
    PrivateFileService,
    PublicFilesService,
  ],
})
export class SeriesMovieModule {}