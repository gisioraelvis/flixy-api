import {
  Req,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PublicFilesService } from './public-files.service';

@Controller('files')
export class PublicFilesController {
  constructor(private readonly publicFilesService: PublicFilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.publicFilesService.addFile(
      req.user.id,
      file.originalname,
      file.buffer,
    );
  }

  // findall
  @Get()
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.publicFilesService.findAll(paginationQuery);
  }

  // delete
  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Req() req: RequestWithUser, @Param('id') id: number) {
    return this.publicFilesService.deletePublicFile(req.user.id, id);
  }
}
