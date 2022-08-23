import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSingleMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  duration: string;

  @IsNotEmpty()
  genres: any;

  @IsNotEmpty()
  languages: any;

  @IsNotEmpty()
  isPremiering: boolean;

  @IsNotEmpty()
  price: string;

  posterUrl: string;
  trailerKey: string;
  videoKey: string;
  filesFolder: string;
}
