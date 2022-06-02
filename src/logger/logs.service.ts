import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Log from './log.entity';
import CreateLogDto from './dto/createLog.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export default class LogsService {
  constructor(
    @InjectRepository(Log)
    private logsRepository: Repository<Log>,
    private configService: ConfigService,
  ) {}

  /**
   * Saves app logs to the database when in production
   * @param logDto
   * @returns {Promise<Log>} || {Promise<void>}
   */
  async saveLog(logDto: CreateLogDto): Promise<void | Log> {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    if (isProduction) {
      const newLog = this.logsRepository.create(logDto);
      await this.logsRepository.save(newLog, {
        data: {
          // Ignore logs from this repository
          isCreatingLogs: true,
        },
      });
      return newLog;
    }
  }
}
