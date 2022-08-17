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
import { CreateSeriesMovieDto } from './dto/create-series-movie.dto';
import { UpdateSeriesMovieDto } from './dto/update-series-movie.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SeriesMovieService } from './series-movie.service';

@Controller('series-movies')
export class SeriesMovieController {
  constructor(private readonly seriesMovieService: SeriesMovieService) {}

  // create a new seriesMovie
  @Post('/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  create(
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
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.seriesMovieService.findAll(paginationQuery);
  }

  // find a seriesMovie by title
  @Get('/search')
  findByTitle(@Query('title') title: string) {
    return this.seriesMovieService.findByTitle(title);
  }

  // find a seriesMovie by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seriesMovieService.findOneById(+id);
  }

  // update a seriesMovie given its id
  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor())
  update(
    @Param('id') id: string,
    @Body() updateSeriesMovieDto: UpdateSeriesMovieDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.seriesMovieService.update(+id, updateSeriesMovieDto, files);
  }

  // delete a seriesMovie given its id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seriesMovieService.remove(+id);
  }
}
