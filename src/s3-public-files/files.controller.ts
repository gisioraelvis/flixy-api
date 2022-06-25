import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.addFile(file.buffer, file.originalname);
  }

  // findall
  @Get()
  async findAll() {
    return this.fileService.findAll();
  }

  // delete
  @Delete('delete/:id')
  async deleteFile(@Param('id') id: number) {
    return this.fileService.deletePublicFile(id);
  }
}
