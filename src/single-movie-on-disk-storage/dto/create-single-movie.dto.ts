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
  price: number;

  posterUrl: string;
  trailerUrl: string;
  videoUrl: string;
  filesFolder: string;
}
