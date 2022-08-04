import { CommonEntity } from 'src/common/entities/common.entity';

export class SingleMovie extends CommonEntity {
  title: string;
  description: string;
  duration: string;
  genres: [];
  languages: [];
  posterUrl: string;
  trailerUrl: string;
  videoUrl: string;
  filesFolder: string;
  isPremiering: boolean;
  price: string;
  views: number;
  likeDislikeId: number;
}
