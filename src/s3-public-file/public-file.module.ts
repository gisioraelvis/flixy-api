import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicFilesController } from './public-file.controller';
import { PublicFileService } from './public-file.service';

@Module({
  imports: [],
  controllers: [PublicFilesController],
  providers: [PublicFileService, PrismaService],
})
export class PublicFileModule {}
