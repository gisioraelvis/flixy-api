import { Module } from '@nestjs/common';
import CustomLogger from './customLogger';
import LogsService from './logs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Log from './log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  providers: [CustomLogger, LogsService],
  exports: [CustomLogger],
})
export class LoggerModule {}
