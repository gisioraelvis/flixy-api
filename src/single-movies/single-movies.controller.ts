import {
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
} from '@nestjs/common';
import { SingleMoviesService } from './single-movies.service';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('single-movies')
export class SingleMoviesController {
  constructor(private readonly singleMoviesService: SingleMoviesService) {}

  // create a new singleMovie
  @Post('/create')
  @UseInterceptors(AnyFilesInterceptor())
  create(
    @Body() createSingleMovieDto: CreateSingleMovieDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.singleMoviesService.create(createSingleMovieDto, files);
  }

  // find all singleMovies
  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.singleMoviesService.findAll(paginationQuery);
  }

  // find a singleMovie by title
  @Get('/search')
  findByTitle(@Query('title') title: string) {
    return this.singleMoviesService.findByTitle(title);
  }

  // find a singleMovie by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.singleMoviesService.findOne(+id);
  }

  // update a singleMovie given its id
  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor())
  update(
    @Param('id') id: string,
    @Body() updateSingleMovieDto: UpdateSingleMovieDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.singleMoviesService.update(+id, updateSingleMovieDto, files);
  }

  // delete a singleMovie given its id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.singleMoviesService.remove(+id);
  }
}
