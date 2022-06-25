import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PublicFile } from './entities/publicFile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PublicFile])],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
