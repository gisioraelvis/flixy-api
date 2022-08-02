import { CommonEntity } from 'src/common/entities/common.entity';
import { Column, ManyToMany, JoinTable, Entity } from 'typeorm';
import { Genre } from './genre.entity';
import { Language } from './language.entity';

@Entity()
export class SingleMovie extends CommonEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  duration: string;

  @ManyToMany(() => Genre, (genre) => genre.movies, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  genres: Genre[];

  @ManyToMany(() => Language, (languages: Language) => languages.movies, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  languages: Language[];

  @Column()
  poster_url: string;

  @Column()
  trailer_url: string;

  @Column()
  video_url: string;

  @Column()
  files_folder: string;

  @Column({ default: false })
  is_premiering: boolean;

  @Column()
  price: string;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  like_dislike_id: number;
}
