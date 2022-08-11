import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicFilesController } from './public-files.controller';
import { PublicFilesService } from './public-files.service';

@Module({
  imports: [],
  controllers: [PublicFilesController],
  providers: [PublicFilesService, PrismaService],
})
export class PublicFilesModule {}
