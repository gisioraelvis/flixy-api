import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import CustomLogger from './logger/customLogger';

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });
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
  app.useLogger(app.get(CustomLogger));
  await app.listen(PORT, HOST);

  const logger = app.get(CustomLogger);
  // TODO: Fix the "DEBUG undefined" message
  logger.debug(`App running on http://${HOST}:${PORT}`);
}
bootstrap();
