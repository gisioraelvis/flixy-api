import { Injectable } from '@nestjs/common';
import CreateLogDto from './dto/createLog.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Log } from '@prisma/client';

@Injectable()
export default class LogsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Saves app logs to the database when in production
   * @param logDto
   * @returns {Promise<any>} || {Promise<void>}
   */
  async saveLog(logDto: CreateLogDto): Promise<Log> {
    return await this.prismaService.log.create({ data: logDto });
  }
}
