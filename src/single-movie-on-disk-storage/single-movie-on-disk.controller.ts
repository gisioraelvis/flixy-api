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
import { SingleMoviesOnDiskService } from './single-movie-on-disk.service';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/authentication/requestWithUser.interface';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';

@Controller('single-movies-on-disk')
export class SingleMoviesOnDiskController {
  constructor(
    private readonly singleMoviesOnDiskService: SingleMoviesOnDiskService,
  ) {}

  // create a new SingleMovie, stores files on disk
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  create(
    @Req() req: RequestWithUser,
    @Body() createSingleMovieDto: CreateSingleMovieDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.singleMoviesOnDiskService.create(
      req.user.id,
      createSingleMovieDto,
      files,
    );
  }

  // find all singleMovies
  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.singleMoviesOnDiskService.findAll(paginationQuery);
  }

  // find a singleMovie by title
  @Get('/search')
  findByTitle(@Query('title') title: string) {
    return this.singleMoviesOnDiskService.findByTitle(title);
  }

  // find a singleMovie by id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.singleMoviesOnDiskService.findOne(id);
  }

  // update a singleMovie given its id
  @Patch(':id')
  @UseInterceptors(AnyFilesInterceptor())
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSingleMovieDto: UpdateSingleMovieDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.singleMoviesOnDiskService.update(
      id,
      updateSingleMovieDto,
      files,
    );
  }

  // delete a singleMovie given its id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.singleMoviesOnDiskService.remove(id);
  }
}
