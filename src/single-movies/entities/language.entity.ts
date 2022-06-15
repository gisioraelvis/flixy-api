import { CommonEntity } from 'src/common/entities/common.entity';
import { Column, Entity, ManyToMany } from 'typeorm';
import { SingleMovie } from './single-movie.entity';

@Entity()
export class Language extends CommonEntity {
  @Column()
  name: string;

  @ManyToMany(() => SingleMovie, (movies: SingleMovie) => movies.languages)
  movies: SingleMovie[];
}
