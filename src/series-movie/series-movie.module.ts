import { Module } from '@nestjs/common';
import { SeriesMovieService } from './series-movie.service';
import { SeriesMovieController } from './series-movie.controller';
import { CommonModule } from 'src/common/common.module';
import { PrivateFileModule } from 'src/s3-private-file/private-file.module';
import { PublicFileModule } from 'src/s3-public-file/public-file.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrivateFileService } from 'src/s3-private-file/private-file.service';
import { PublicFileService } from 'src/s3-public-file/public-file.service';
import { SeriesSeasonService } from './series-season.service';
import { SeasonEpisodeService } from './season-episode.service';
import { SeriesSeasonController } from './series-season.controller';
import { SeasonEpisodeController } from './season-episode.controller';

@Module({
  imports: [CommonModule, PublicFileModule, PrivateFileModule],
  controllers: [
    SeriesMovieController,
    SeriesSeasonController,
    SeasonEpisodeController,
  ],
  providers: [
    PrismaService,
    PrivateFileService,
    PublicFileService,
    SeriesMovieService,
    SeriesSeasonService,
    SeasonEpisodeService,
  ],
})
export class SeriesMovieModule {}
