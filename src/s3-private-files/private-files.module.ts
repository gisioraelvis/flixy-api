import { Module } from '@nestjs/common';
import { PrivateFilesService } from './private-files.service';
import { PrivateFilesController } from './private-files.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [PrivateFilesController],
  providers: [PrivateFilesService, PrismaService],
})
export class PrivateFilesModule {}
