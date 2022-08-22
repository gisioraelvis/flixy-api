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
  ParseIntPipe,
} from '@nestjs/common';
import { CreateSeriesMovieDto } from './dto/create-series-movie.dto';
import { UpdateSeriesMovieDto } from './dto/update-series-movie.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/authentication/requestWithUser.interface';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';
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
  findOneSeriesMovieById(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
  ) {
    return this.seriesMovieService.findOneById(seriesMovieId);
  }

  // update a seriesMovie given its id
  @Patch(':seriesMovieId')
  @UseInterceptors(AnyFilesInterceptor())
  updateSeriesMovie(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Body() updateSeriesMovieDto: UpdateSeriesMovieDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seriesMovieService.update(
      seriesMovieId,
      updateSeriesMovieDto,
      files,
    );
  }

  // delete a seriesMovie given its id
  @Delete(':id')
  removeSeriesMovie(@Param('id', ParseIntPipe) id: number) {
    return this.seriesMovieService.remove(id);
  }
}
