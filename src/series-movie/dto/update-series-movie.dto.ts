import { PartialType } from '@nestjs/mapped-types';
import {
  CreateSeasonEpisodeDto,
  CreateSeriesMovieDto,
  CreateSeriesSeasonDto,
} from './create-series-movie.dto';

export class UpdateSeriesMovieDto extends PartialType(CreateSeriesMovieDto) {}
export class UpdateSeriesSeasonDto extends PartialType(CreateSeriesSeasonDto) {}
export class UpdateSeasonEpisodeDto extends PartialType(
  CreateSeasonEpisodeDto,
) {}
