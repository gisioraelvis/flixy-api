import { Injectable } from '@nestjs/common';
import CreateLogDto from './dto/createLog.dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export default class LogsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Saves app logs to the database when in production
   * @param logDto
   * @returns {Promise<Log>} || {Promise<void>}
   */
  async saveLog(logDto: CreateLogDto): Promise<void | any> {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    if (isProduction) {
      const newLog = this.prismaService.log.create({ data: logDto });
      return newLog;
    }
  }
}
