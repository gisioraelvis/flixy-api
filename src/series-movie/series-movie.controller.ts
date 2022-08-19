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

  // create a new seriesMovie
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

  // find all seriesMovies
  @Get()
  findAllSeriesMovies(@Query() paginationQuery: PaginationQueryDto) {
    return this.seriesMovieService.findAll(paginationQuery);
  }

  // find a seriesMovie by title
  @Get('/search')
  findSeriesMovieByTitle(@Query('title') title: string) {
    return this.seriesMovieService.findByTitle(title);
  }

  // find a seriesMovie by id
  @Get(':id')
  findOneSeriesMovieById(@Param('id') id: string) {
    return this.seriesMovieService.findOneById(+id);
  }

  // update a seriesMovie given its id
  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor())
  updateSeriesMovie(
    @Param('id') id: string,
    @Body() updateSeriesMovieDto: UpdateSeriesMovieDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seriesMovieService.update(+id, updateSeriesMovieDto, files);
  }

  // delete a seriesMovie given its id
  @Delete(':id')
  removeSeriesMovie(@Param('id') id: string) {
    return this.seriesMovieService.remove(+id);
  }

  // #####################End of SeriesMovie Endpoints##########################

  // ----SeriesSeason Endpoints-------------------------------------------------

  // create a new series season for a series movie
  // takes the series movie id linked to as a param
  @Post(':id/seasons')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  createSeriesSeason(
    @Req() req: RequestWithUser,
    @Param('id') movieId: string,
    @Body() createSerieSeasonDto: CreateSeriesSeasonDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.seriesSeasonService.create(
      req.user.id,
      +movieId,
      createSerieSeasonDto,
      files,
    );
  }

  // find series season by title
  @Get('seasons/search')
  findSeriesSeasonByTitle(@Query('title') title: string) {
    return this.seriesSeasonService.findByTitle(title);
  }

  // find series season by id
  @Get(':seriesMovieId/seasons/:seasonId')
  findOneSeriesSeason(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seriesSeasonService.findOneById(+seriesMovieId, +seasonId);
  }

  // find series season by id
  @Get(':seriesMovieId/seasons')
  findAllSeriesMovieSeasons(@Param('seriesMovieId') seriesMovieId: string) {
    return this.seriesSeasonService.findAll(+seriesMovieId);
  }

  // update series season given its id
  @Patch('/:seriesMovieId/seasons/:seasonId')
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

  // delete series season given its id
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

  // create new Episode for a Season of a Seriesmovie
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
      +seasonId,
      +seriesMovieId,
      createSeasonEpisodeDto,
      files,
    );
  }

  // find all episodes for a season of a series movie
  @Get('/:seriesMovieId/seasons/:seasonId/episodes')
  findAllSeasonEpisodes(
    @Param('seriesMovieId') seriesMovieId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seasonEpisodeService.findAllSeasonEpisodes(
      +seasonId,
      +seriesMovieId,
    );
  }

  // find a season episode by id
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

  // update a season episode given its id
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

  // delete a season episode given its id
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
