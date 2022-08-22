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
import { CreateSeriesSeasonDto } from './dto/create-series-movie.dto';
import { UpdateSeriesSeasonDto } from './dto/update-series-movie.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/authentication/requestWithUser.interface';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';
import { SeriesSeasonService } from './series-season.service';

@Controller('series-movies')
export class SeriesSeasonController {
  constructor(private readonly seriesSeasonService: SeriesSeasonService) {}

  // create a new season for a series movie
  @Post(':seriesMovieId/seasons')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  createSeriesSeason(
    @Req() req: RequestWithUser,
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Body() createSerieSeasonDto: CreateSeriesSeasonDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.seriesSeasonService.create(
      req.user.id,
      seriesMovieId,
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
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Param('seasonId', ParseIntPipe) seasonId: number,
  ) {
    return this.seriesSeasonService.findOneById(seriesMovieId, seasonId);
  }

  // find all SeriesMovie seasons
  @Get(':seriesMovieId/seasons')
  findAllSeriesMovieSeasons(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
  ) {
    return this.seriesSeasonService.findAll(seriesMovieId);
  }

  // update SeriesMovie Season
  @Patch(':seriesMovieId/seasons/:seasonId')
  @UseInterceptors(AnyFilesInterceptor())
  updateSeriesSeason(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Body() updateSeriesSeasonDto: UpdateSeriesSeasonDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seriesSeasonService.update(
      seriesMovieId,
      seasonId,
      updateSeriesSeasonDto,
      files,
    );
  }

  // delete SeriesMovie Season
  @Delete('/:seriesMovieId/seasons/:seasonId')
  removeSeriesSeason(
    @Param('seriesMovieId', ParseIntPipe) seriesMovieId: number,
    @Param('seasonId', ParseIntPipe) seasonId: number,
  ) {
    return this.seriesSeasonService.remove(seriesMovieId, seasonId);
  }
}
