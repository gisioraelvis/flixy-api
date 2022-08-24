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
  trailerKey: string;
  filesFolder: string;
}

export class CreateSeriesSeasonDto {
  @IsNotEmpty()
  seasonNumber: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  isPremiering: boolean;

  @IsNotEmpty()
  price: number;

  posterUrl: string;
  trailerKey: string;
  filesFolder: string;
}

export class CreateSeasonEpisodeDto {
  @IsNotEmpty()
  episodeNumber: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  duration: string;

  posterUrl: string;
  videoKey: string;
  filesFolder: string;
}
