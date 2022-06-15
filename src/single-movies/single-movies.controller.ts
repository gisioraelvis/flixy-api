import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SingleMoviesService } from './single-movies.service';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';

@Controller('single-movies')
export class SingleMoviesController {
  constructor(private readonly singleMoviesService: SingleMoviesService) {}

  // create a new singleMovie
  @Post('/create')
  create(@Body() createSingleMovieDto: CreateSingleMovieDto) {
    return this.singleMoviesService.create(createSingleMovieDto);
  }

  // find all singleMovies
  @Get()
  findAll() {
    return this.singleMoviesService.findAll();
  }

  // find a singleMovie by title in query string (?title=...)
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
