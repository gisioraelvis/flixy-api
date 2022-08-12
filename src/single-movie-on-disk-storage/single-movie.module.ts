import { Module } from '@nestjs/common';
import { SingleMoviesOnDiskService } from './single-movie.service';
import { SingleMoviesOnDiskController } from './single-movie.controller';
import { CommonModule } from 'src/common/common.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [CommonModule],
  controllers: [SingleMoviesOnDiskController],
  providers: [SingleMoviesOnDiskService, PrismaService],
})
export class SingleMoviesOnDiskModule {}
