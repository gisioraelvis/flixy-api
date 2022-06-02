import { Injectable, ConsoleLogger } from '@nestjs/common';
import { ConsoleLoggerOptions } from '@nestjs/common/services/console-logger.service';
import { ConfigService } from '@nestjs/config';
import getLogLevels from '../utils/logLevels';
import LogsService from './logs.service';

@Injectable()
class CustomLogger extends ConsoleLogger {
  private readonly logsService: LogsService;
  constructor(
    context: string,
    options: ConsoleLoggerOptions,
    configService: ConfigService,
    logsService: LogsService,
  ) {
    const environment = configService.get('NODE_ENV');

    super(context, {
      ...options,
      logLevels: getLogLevels(environment === 'production'),
    });

    this.logsService = logsService;
  }

  log(message: string, context?: string) {
    super.log.apply(this, [message, context]);

    this.logsService.saveLog({
      message,
      context,
      level: 'log',
    });
  }
  error(message: string, context?: string, stack?: string) {
    super.error.apply(this, [message, context, stack]);

    this.logsService.saveLog({
      message,
      context,
      level: 'error',
    });
  }
  warn(message: string, context?: string) {
    super.warn.apply(this, [message, context]);

    this.logsService.saveLog({
      message,
      context,
      level: 'error',
    });
  }
  debug(message: string, context?: string) {
    super.debug.apply(this, [message, context]);

    this.logsService.saveLog({
      message,
      context,
      level: 'error',
    });
  }
  verbose(message: string, context?: string) {
    super.debug.apply(this, [message, context]);

    this.logsService.saveLog({
      message,
      context,
      level: 'error',
    });
  }
}

export default CustomLogger;
