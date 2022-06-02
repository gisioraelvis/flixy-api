import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Log from './log.entity';
import CreateLogDto from './dto/createLog.dto';

@Injectable()
export default class LogsService {
  constructor(
    @InjectRepository(Log)
    private logsRepository: Repository<Log>,
  ) {}
  /**
   * Saves app logs to the database when in production
   * @param log
   * @returns {Promise<Log>}
   */
  async createLog(log: CreateLogDto): Promise<Log> {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      const newLog = this.logsRepository.create(log);
      await this.logsRepository.save(newLog, {
        data: {
          isCreatingLogs: true,
        },
      });
      return newLog;
    }
  }
}
