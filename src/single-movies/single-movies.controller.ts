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
  Res,
} from '@nestjs/common';
import { SingleMoviesService } from './single-movies.service';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('single-movies')
export class SingleMoviesController {
  constructor(private readonly singleMoviesService: SingleMoviesService) {}

  // create a new singleMovie
  @Post('/create')
  create(@Body() createSingleMovieDto: CreateSingleMovieDto) {
    return this.singleMoviesService.create(createSingleMovieDto);
  }

  @Post('upload')
  @UseInterceptors(AnyFilesInterceptor())
  upload(
    @Body() movieDetails: any,
    @UploadedFiles()
    files: Express.Multer.File[],
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.singleMoviesService.upload(movieDetails, files);
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
  update(
    @Param('id') id: string,
    @Body() updateSingleMovieDto: UpdateSingleMovieDto,
  ) {
    return this.singleMoviesService.update(+id, updateSingleMovieDto);
  }

  // delete a singleMovie given its id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.singleMoviesService.remove(+id);
  }
}