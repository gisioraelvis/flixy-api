import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Handles connecting and disconnecting prisma to the database.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      //Log to stdout/console
      log: ['query', 'info', 'warn', 'error'],

      // // Emit as events
      // log: [
      //   { emit: 'stdout', level: 'query' },
      //   { emit: 'stdout', level: 'info' },
      //   { emit: 'stdout', level: 'warn' },
      //   { emit: 'stdout', level: 'error' },
      // ],
    });

    // Event-based logging - Use Logger.log() to save logs to the db
    // this.$on<any>('query', (event: Prisma.QueryEvent) => {
    //   Logger.log('Prisma Query: \n' + event.query);
    //   Logger.log('Prisma Query Duration: ' + event.duration + 'ms');
    // });
  }

  async onModuleInit() {
    await this.$connect();
  }

  // Before app shutdown hooks fire and beforeExit event
  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
