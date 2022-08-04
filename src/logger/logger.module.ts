import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import CustomLogger from './customLogger';
import LogsService from './logs.service';

@Module({
  imports: [],
  providers: [CustomLogger, LogsService, PrismaService],
  exports: [CustomLogger],
})
export class LoggerModule {}
