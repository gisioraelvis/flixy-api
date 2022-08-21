import {
  Req,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateSeasonEpisodeDto } from './dto/create-series-movie.dto';
import { UpdateSeasonEpisodeDto } from './dto/update-series-movie.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SeasonEpisodeService } from './season-episode.service';

@Controller('series-movies')
export class SeasonEpisodeController {
  constructor(private readonly seasonEpisodeService: SeasonEpisodeService) {}

  // create an new Episode for a Season
  @Post('/:seriesMovieId/seasons/:seasonId/episodes')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  createSeasonEpisode(
    @Req() req: RequestWithUser,
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Body() createSeasonEpisodeDto: CreateSeasonEpisodeDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.seasonEpisodeService.create(
      req.user.id,
      seriesMovieId,
      seasonId,
      createSeasonEpisodeDto,
      files,
    );
  }

  // find all Season Episodes
  @Get('/:seriesMovieId/seasons/:seasonId/episodes')
  findAllSeasonEpisodes(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Param('seasonId', ParseIntPipe) seasonId: number,
  ) {
    return this.seasonEpisodeService.findAllSeasonEpisodes(
      seriesMovieId,
      seasonId,
    );
  }

  // find a SeasonEpisode by id
  @Get('/:seriesMovieId/seasons/:seasonId/episodes/:episodeId')
  findOneEpisodeById(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Param('episodeId', ParseIntPipe) episodeId: number,
  ) {
    return this.seasonEpisodeService.findEpisodeById(
      seriesMovieId,
      seasonId,
      episodeId,
    );
  }

  // update a SeasonEpisode given its id
  @Patch('/:seriesMovieId/seasons/:seasonId/episodes/:episodeId')
  @UseInterceptors(AnyFilesInterceptor())
  update(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Param('episodeId', ParseIntPipe) episodeId: number,
    @Body() updateSeasonEpisodeDto: UpdateSeasonEpisodeDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seasonEpisodeService.update(
      seriesMovieId,
      seasonId,
      episodeId,
      updateSeasonEpisodeDto,
      files,
    );
  }

  // delete a SeasonEpisode given its id
  @Delete('/:seriesMovieId/seasons/:seasonId/episodes/:episodeId')
  removeSeasonEpisode(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Param('episodeId', ParseIntPipe) episodeId: number,
  ) {
    return this.seasonEpisodeService.remove(seriesMovieId, seasonId, episodeId);
  }
}
