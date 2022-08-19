import { Module } from '@nestjs/common';
import { PrivateFileService } from './private-file.service';
import { PrivateFileController } from './private-file.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [PrivateFileController],
  providers: [PrivateFileService, PrismaService],
})
export class PrivateFileModule {}
