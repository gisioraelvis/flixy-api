import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [],
  controllers: [FilesController],
  providers: [FilesService, PrismaService],
})
export class FilesModule {}
