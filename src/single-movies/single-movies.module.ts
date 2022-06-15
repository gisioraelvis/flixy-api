import { Module } from '@nestjs/common';
import { SingleMoviesService } from './single-movies.service';
import { SingleMoviesController } from './single-movies.controller';
import { CommonModule } from 'src/common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { Language } from './entities/language.entity';
import { SingleMovie } from './entities/single-movie.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([SingleMovie, Genre, Language]),
  ],
  controllers: [SingleMoviesController],
  providers: [SingleMoviesService],
})
export class SingleMoviesModule {}
