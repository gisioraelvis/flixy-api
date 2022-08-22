import { Module } from '@nestjs/common';
import { PrivateFileService } from './private-file.service';
import { PrivateFileController } from './private-file.controller';
import { AuthenticationModule } from 'src/authentication/authentication.module';
import { UserModule } from 'src/user/user.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [AuthenticationModule, UserModule],
  controllers: [PrivateFileController],
  providers: [PrivateFileService, PrismaService],
})
export class PrivateFileModule {}
