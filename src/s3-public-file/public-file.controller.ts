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
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PublicFileService } from './public-file.service';

@Controller('public-files')
export class PublicFilesController {
  constructor(private readonly publicFileService: PublicFileService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPublicUserFile(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.publicFileService.uploadFile(
      req.user.id,
      file.originalname,
      file.buffer,
    );
  }

  @Get()
  async getAllPublicUserFiles(@Query() paginationQuery: PaginationQueryDto) {
    return this.publicFileService.findAll(paginationQuery);
  }

  @Get(':fileId')
  async getPublicUserFileById(@Param('fileId', ParseIntPipe) fileId: number) {
    return this.publicFileService.findOne(fileId);
  }

  @Delete('delete/:fileId')
  @UseGuards(JwtAuthGuard)
  async deletePublicUserFile(
    @Req() req: RequestWithUser,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.publicFileService.deleteFile(req.user.id, fileId);
  }
}
