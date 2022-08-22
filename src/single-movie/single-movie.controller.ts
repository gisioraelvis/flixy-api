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
import { SingleMovieService } from './single-movie.service';
import { CreateSingleMovieDto } from './dto/create-single-movie.dto';
import { UpdateSingleMovieDto } from './dto/update-single-movie.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('single-movies')
export class SingleMovieController {
  constructor(private readonly singleMovieService: SingleMovieService) {}

  // create a new singleMovie
  @Post()
  @UseGuards(RolesGuard(Role.ADMIN, Role.CONTENTCREATOR))
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  create(
    @Req() req: RequestWithUser,
    @Body() createSingleMovieDto: CreateSingleMovieDto,
    @UploadedFiles()
    files: Array<Express.Multer.File>,
  ) {
    return this.singleMovieService.create(
      req.user.id,
      createSingleMovieDto,
      files,
    );
  }

  // find all singleMovies
  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.singleMovieService.findAll(paginationQuery);
  }

  // find a singleMovie by title
  @Get('/search')
  findByTitle(@Query('title') title: string) {
    return this.singleMovieService.findByTitle(title);
  }

  // find a singleMovie by id
  @Get(':singleMovieId')
  findOne(@Param('singleMovieId', ParseIntPipe) singleMovieId: number) {
    return this.singleMovieService.findOne(singleMovieId);
  }

  // update a singleMovie given its id
  @Patch(':singleMovieId')
  @UseInterceptors(AnyFilesInterceptor())
  update(
    @Param('singleMovieId', ParseIntPipe) singleMovieId: number,
    @Body() updateSingleMovieDto: UpdateSingleMovieDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.singleMovieService.update(
      singleMovieId,
      updateSingleMovieDto,
      files,
    );
  }

  // delete a singleMovie given its id
  @Delete(':singleMovieId')
  remove(@Param('singleMovieId', ParseIntPipe) singleMovieId: number) {
    return this.singleMovieService.remove(singleMovieId);
  }
}
