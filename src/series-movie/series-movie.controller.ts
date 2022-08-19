import {
  Req,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  CreateSeasonEpisodeDto,
  CreateSeriesMovieDto,
  CreateSeriesSeasonDto,
} from './dto/create-series-movie.dto';
import {
  UpdateSeasonEpisodeDto,
  UpdateSeriesMovieDto,
  UpdateSeriesSeasonDto,
} from './dto/update-series-movie.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SeriesMovieService } from './series-movie.service';
import { SeriesSeasonService } from './series-season.service';
import { SeasonEpisodeService } from './season-episode.service';

@Controller('series-movies')
export class SeriesMovieController {
  constructor(
    private readonly seriesMovieService: SeriesMovieService,
    private readonly seriesSeasonService: SeriesSeasonService,
    private readonly seasonEpisodeService: SeasonEpisodeService,
  ) {}

  //---SeriesMovie Endpoints------------------------------------------

  // create a new SeriesMovie
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  createSeriesMovie(
    @Req() req: RequestWithUser,
    @Body() createSeriesMovieDto: CreateSeriesMovieDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.seriesMovieService.create(
      req.user.id,
      createSeriesMovieDto,
      files,
    );
  }

  // find all SeriesMovies
  @Get()
  findAllSeriesMovies(@Query() paginationQuery: PaginationQueryDto) {
    return this.seriesMovieService.findAll(paginationQuery);
  }

  // find a SeriesMovie by title
  @Get('/search')
  findSeriesMovieByTitle(@Query('title') title: string) {
    return this.seriesMovieService.findByTitle(title);
  }

  // find a seriesMovie by id
  @Get(':seriesMovieId')
  findOneSeriesMovieById(@Param('seriesMovieId') seriesMovieId: string) {
    return this.seriesMovieService.findOneById(+seriesMovieId);
  }

  // update a seriesMovie given its id
  @Patch(':seriesMovieId')
  @UseInterceptors(AnyFilesInterceptor())
  updateSeriesMovie(
    @Param('seriesMovieId') seriesMovieId: string,
    @Body() updateSeriesMovieDto: UpdateSeriesMovieDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seriesMovieService.update(
      +seriesMovieId,
      updateSeriesMovieDto,
      files,
    );
  }

  // delete a seriesMovie given its id
  @Delete(':id')
  removeSeriesMovie(@Param('id') id: string) {
    return this.seriesMovieService.remove(+id);
  }

  // #####################End of SeriesMovie Endpoints##########################

  // ----SeriesMovie Season Endpoints-------------------------------------------------

  // create a new season for a series movie
  @Post(':seriesMovieId/seasons')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  createSeriesSeason(
    @Req() req: RequestWithUser,
    @Param('seriesMovieId') seriesMovieId: string,
    @Body() createSerieSeasonDto: CreateSeriesSeasonDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.seriesSeasonService.create(
      req.user.id,
      +seriesMovieId,
      createSerieSeasonDto,
      files,
    );
  }

  // find season by title
  @Get('seasons/search')
  findSeriesSeasonByTitle(@Query('title') title: string) {
    return this.seriesSeasonService.findByTitle(title);
  }

  // find season by id
  @Get(':seriesMovieId/seasons/:seasonId')
  findOneSeriesSeason(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seriesSeasonService.findOneById(+seriesMovieId, +seasonId);
  }

  // find all SeriesMovie seasons
  @Get(':seriesMovieId/seasons')
  findAllSeriesMovieSeasons(@Param('seriesMovieId') seriesMovieId: string) {
    return this.seriesSeasonService.findAll(+seriesMovieId);
  }

  // update SeriesMovie Season
  @Patch(':seriesMovieId/seasons/:seasonId')
  @UseInterceptors(AnyFilesInterceptor())
  updateSeriesSeason(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
    @Body() updateSeriesSeasonDto: UpdateSeriesSeasonDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seriesSeasonService.update(
      +seriesMovieId,
      +seasonId,
      updateSeriesSeasonDto,
      files,
    );
  }

  // delete SeriesMovie Season
  @Delete('/:seriesMovieId/seasons/:seasonId')
  removeSeriesSeason(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seriesSeasonService.remove(+seriesMovieId, +seasonId);
  }

  // #####################End of SeriesSeason Endpoints##########################

  /**
   * ---Season Episode Endpoints-------------------------------------------------
   */

  // create an new Episode for a Season
  @Post('/:seriesMovieId/seasons/:seasonId/episodes')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  createSeasonEpisode(
    @Req() req: RequestWithUser,
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
    @Body() createSeasonEpisodeDto: CreateSeasonEpisodeDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.seasonEpisodeService.create(
      req.user.id,
      +seriesMovieId,
      +seasonId,
      createSeasonEpisodeDto,
      files,
    );
  }

  // find all Season Episodes
  @Get('/:seriesMovieId/seasons/:seasonId/episodes')
  findAllSeasonEpisodes(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seasonEpisodeService.findAllSeasonEpisodes(
      +seriesMovieId,
      +seasonId,
    );
  }

  // find a SeasonEpisode by id
  @Get('/:seriesMovieId/seasons/:seasonId/episodes/:episodeId')
  findOneEpisodeById(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
    @Param('episodeId') episodeId: string,
  ) {
    return this.seasonEpisodeService.findEpisodeById(
      +seriesMovieId,
      +seasonId,
      +episodeId,
    );
  }

  // update a SeasonEpisode given its id
  @Patch('/:seriesMovieId/seasons/:seasonId/episodes/:episodeId')
  @UseInterceptors(AnyFilesInterceptor())
  update(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
    @Param('episodeId') episodeId: string,
    @Body() updateSeasonEpisodeDto: UpdateSeasonEpisodeDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seasonEpisodeService.update(
      +seriesMovieId,
      +seasonId,
      +episodeId,
      updateSeasonEpisodeDto,
      files,
    );
  }

  // delete a SeasonEpisode given its id
  @Delete('/:seriesMovieId/seasons/:seasonId/episodes/:episodeId')
  removeSeasonEpisode(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
    @Param('episodeId') episodeId: string,
  ) {
    return this.seasonEpisodeService.remove(
      +seriesMovieId,
      +seasonId,
      +episodeId,
    );
  }
}
