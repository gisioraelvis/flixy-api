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
  genres: string;

  @IsNotEmpty()
  languages: string;

  @IsNotEmpty()
  is_premiering: boolean;

  @IsNotEmpty()
  price: string;

  poster_name: string;
  trailer_url: string;
  video_url: string;
  files_folder: string;
}
