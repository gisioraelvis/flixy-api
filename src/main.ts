import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import CustomLogger from './logger/customLogger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });
  app.useLogger(app.get(CustomLogger));
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

  const HOST = process.env.HOST || 'localhost';
  const PORT = process.env.PORT || 5000;
  await app.listen(PORT, HOST);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
