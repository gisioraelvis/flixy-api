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
  CreateSeriesMovieDto,
  CreateSeriesSeasonDto,
} from './dto/create-series-movie.dto';
import {
  UpdateSeriesMovieDto,
  UpdateSeriesSeasonDto,
} from './dto/update-series-movie.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SeriesMovieService } from './series-movie.service';
import { SeriesSeasonService } from './series-season.service';

@Controller('series-movies')
export class SeriesMovieController {
  constructor(
    private readonly seriesMovieService: SeriesMovieService,
    private readonly seriesSeasonService: SeriesSeasonService,
  ) {}

  //---Start of Series Movie Endpoints-----------------------------------------

  // create a new seriesMovie
  @Post('/create')
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

  // #####################End of Series Movie Endpoints##########################

  // ----Start of Series Season Endpoints----------------------------------------

  // create a new series season for a series movie
  // takes the series movie id linked to as a param
  @Post('seasons/create/:id')
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
  @Get('seasons/:id')
  findOneSeriesSeason(@Param('id') id: string) {
    return this.seriesSeasonService.findOneById(+id);
  }

  // update series season  given its id
  @Patch('seasons/:id')
  @UseInterceptors(AnyFilesInterceptor())
  updateSeriesSeason(
    @Param('id') id: string,
    @Body() updateSeriesSeasonDto: UpdateSeriesSeasonDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seriesSeasonService.update(+id, updateSeriesSeasonDto, files);
  }

  // delete series season given its id
  @Delete('seasons/:id')
  removeSeriesSeason(@Param('id') id: string) {
    return this.seriesSeasonService.remove(+id);
  }

  // #####################End of Series Season Endpoints##########################
}
