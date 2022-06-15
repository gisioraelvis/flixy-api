import { Column, Entity, ManyToMany } from 'typeorm';
import { CommonEntity } from '../../common/entities/common.entity';
import { SingleMovie } from './single-movie.entity';

@Entity()
export class Genre extends CommonEntity {
  @Column()
  name: string;

  @ManyToMany(() => SingleMovie, (movies: SingleMovie) => movies.genres)
  movies: SingleMovie[];
}
