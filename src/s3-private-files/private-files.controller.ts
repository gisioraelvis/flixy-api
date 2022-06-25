import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import RequestWithUser from 'src/auth/requestWithUser.interface';
import { PrivateFilesService } from './private-files.service';

@Controller('private-files')
export class PrivateFilesController {
  constructor(private readonly privateFilesService: PrivateFilesService) {}
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async addPrivateFile(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.privateFilesService.addPrivateFile(
      file.buffer,
      req.user.id,
      file.originalname,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPrivateFile(
    @Req() req: RequestWithUser,
    @Param() fileId,
    @Res() res: Response,
  ) {
    const file = await this.privateFilesService.getPrivateFile(
      req.user.id,
      fileId.id,
    );
    file.stream.pipe(res);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllPrivateFiles(@Req() request: RequestWithUser) {
    return this.privateFilesService.getAllPrivateFiles(request.user.id);
  }
}
