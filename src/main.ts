import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'aws-sdk';
import helmet from 'helmet';
import { AppModule } from './app.module';
import CustomLogger from './logger/customLogger';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // env variables
  const configService = app.get(ConfigService);

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
  app.useGlobalInterceptors(
    // Exludes specified properties(@Exclude() on entity fields) from response
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  config.update({
    accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
    region: configService.get('AWS_REGION'),
  });

  const NODE_ENV = configService.get('NODE_ENV');

  // In production save logs to the db using the custom logger
  if (NODE_ENV === 'production') {
    app.useLogger(app.get(CustomLogger));
  }

  const PORT = configService.get('APP_PORT');
  const HOST = configService.get('APP_HOST');
  await app.listen(PORT, HOST);

  // In development console log port and host
  Logger.debug(`App running in ${NODE_ENV} mode on ${await app.getUrl()}`);

  // To handle shutdown signal
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
}
bootstrap();
