import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import CustomLogger from './logger/customLogger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  // env variables
  const cofigs = app.get(ConfigService);
  app.use(helmet());
  app.enableCors();
  // i.e /api/v1
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // Custom logger
  app.useLogger(app.get(CustomLogger));
  const PORT = cofigs.get('PORT');
  const HOST = cofigs.get('HOST');
  await app.listen(PORT, HOST);

  Logger.debug(`App running on ${await app.getUrl()}`);
}
bootstrap();
