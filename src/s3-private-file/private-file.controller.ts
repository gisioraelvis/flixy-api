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
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrivateFileService } from './private-file.service';

@Controller('private-files')
export class PrivateFileController {
  constructor(private readonly privateFileService: PrivateFileService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPrivateUserFile(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.privateFileService.uploadFile(
      req.user.id,
      file.originalname,
      file.buffer,
    );
  }

  @Get(':fileId')
  @UseGuards(JwtAuthGuard)
  async getPrivateUserFile(
    @Req() req: RequestWithUser,
    @Param('fileId', ParseIntPipe) fileId: number,
    @Res() res: Response,
  ) {
    const file = await this.privateFileService.getFile(req.user.id, fileId);
    file.stream.pipe(res);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllPrivateUserFiles(
    @Req() request: RequestWithUser,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.privateFileService.getAllFiles(
      request.user.id,
      paginationQuery,
    );
  }

  @Delete('delete/:fileId')
  @UseGuards(JwtAuthGuard)
  async deletePrivateUserFile(
    @Req() req: RequestWithUser,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.privateFileService.deleteFile(req.user.id, fileId);
  }
}
