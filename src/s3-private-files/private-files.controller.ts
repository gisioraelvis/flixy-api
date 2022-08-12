import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  Delete,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrivateFileService } from './private-files.service';

@Controller('private-files')
export class PrivateFileController {
  constructor(private readonly privateFileService: PrivateFileService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addPrivateFile(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.privateFileService.uploadFile(
      req.user.id,
      file.originalname,
      file.buffer,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPrivateFile(
    @Req() req: RequestWithUser,
    @Param('id') fileId: string,
    @Res() res: Response,
  ) {
    const file = await this.privateFileService.getFile(req.user.id, +fileId);
    file.stream.pipe(res);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllPrivateFiles(
    @Req() request: RequestWithUser,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.privateFileService.getAllFiles(
      request.user.id,
      paginationQuery,
    );
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.privateFileService.deleteFile(req.user.id, +id);
  }
}
