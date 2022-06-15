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
  genres: any[];

  @IsNotEmpty()
  languages: any[];

  @IsNotEmpty()
  @IsString()
  poster_url: string;

  @IsNotEmpty()
  @IsString()
  trailer_url: string;

  @IsNotEmpty()
  @IsString()
  video_url: string;

  @IsNotEmpty()
  is_premiering: boolean;

  @IsNotEmpty()
  price: string;
}
