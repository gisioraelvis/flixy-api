import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { LoggerModule } from './logger/logger.module';
import { AppMailerModule } from './mailer/mailer.module';
import { SmsModule } from './sms/sms.module';
import { SingleMoviesOnDiskModule } from './single-movie-on-disk-storage/single-movie-on-disk.module';
import * as Joi from 'joi';
import HttpLoggerMiddleware from './logger/httpLoggerMiddleware';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PublicFileModule } from './s3-public-files/public-files.module';
import { PrivateFileModule } from './s3-private-files/private-files.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { SingleMovieModule } from './single-movie/single-movie.module';
import { StreamingModule } from './streaming/streaming.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'staging', 'production')
          .default('development'),
        APP_HOST: Joi.string().default('localhost'),
        APP_PORT: Joi.number().default(5000),
        POSTGRES_HOST: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        JWT_EMAIL_VERIFICATION: Joi.string().required(),
        JWT_EMAIL_VERIFICATION_EXPIRES_IN: Joi.string().required(),
        EMAIL_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_API_KEY: Joi.string().required(),
        SMTP_USERNAME: Joi.string().required(),
        SMTP_PASSWORD: Joi.string().required(),
        EMAIL_CONFIRMATION_URL: Joi.string().required(),
        EMAIL_PASSWORD_RESET_URL: Joi.string().required(),
        TWILIO_ACCOUNT_SID: Joi.string().required(),
        TWILIO_AUTH_TOKEN: Joi.string().required(),
        TWILIO_VERIFICATION_SERVICE_SID: Joi.string().required(),
        TWILIO_SENDER_PHONE_NUMBER: Joi.string().required(),
        UPLOADS_FOLDER: Joi.string().required(),
        SINGLE_MOVIES_FOLDER: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_PUBLIC_BUCKET_NAME: Joi.string().required(),
        AWS_PRIVATE_BUCKET_NAME: Joi.string().required(),
      }),
    }),
    // makes uploads folder accessible to the client
    // e.g http://127.0.0.1:5000/uploads/movies/single-movies/single-movie-1/real-hack-screens.jpeg
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    CommonModule,
    UserModule,
    LoggerModule,
    AppMailerModule,
    SmsModule,
    SingleMoviesOnDiskModule,
    PublicFileModule,
    PrivateFileModule,
    SingleMovieModule,
    StreamingModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
