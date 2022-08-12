import { Module } from '@nestjs/common';
import { SingleMoviesOnDiskService } from './single-movie-on-disk.service';
import { SingleMoviesOnDiskController } from './single-movie-on-disk.controller';
import { CommonModule } from 'src/common/common.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [CommonModule],
  controllers: [SingleMoviesOnDiskController],
  providers: [SingleMoviesOnDiskService, PrismaService],
})
export class SingleMoviesOnDiskModule {}
