import { PartialType } from '@nestjs/mapped-types';
import { CreateSingleMovieDto } from './create-single-movie.dto';

export class UpdateSingleMovieDto extends PartialType(CreateSingleMovieDto) {}
