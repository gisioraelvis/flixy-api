import { Module } from '@nestjs/common';
import { SingleMoviesService } from './single-movie.service';
import { SingleMoviesController } from './single-movie.controller';
import { CommonModule } from 'src/common/common.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [CommonModule],
  controllers: [SingleMoviesController],
  providers: [SingleMoviesService, PrismaService],
})
export class SingleMoviesModule {}
