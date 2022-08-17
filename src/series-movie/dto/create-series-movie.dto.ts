import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSeriesMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  genres: any;

  @IsNotEmpty()
  languages: any;

  @IsNotEmpty()
  isPremiering: boolean;

  posterUrl: string;
  trailerUrl: string;
  filesFolder: string;
}

export class CreateSeriesSeasonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  number: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  isPremiering: boolean;

  price: string;
  posterUrl: string;
  trailerUrl: string;
  filesFolder: string;
}

export class CreateSeasonEpisodeDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  duration: string;

  posterUrl: string;
  trailerUrl: string;
  videoKey: string;
}
