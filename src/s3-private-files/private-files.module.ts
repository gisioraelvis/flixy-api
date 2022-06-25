import { Module } from '@nestjs/common';
import { PrivateFilesService } from './private-files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import PrivateFile from './entities/private-file.entity';
import { PrivateFilesController } from './private-files.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrivateFile]), AuthModule, UserModule],
  controllers: [PrivateFilesController],
  providers: [PrivateFilesService],
})
export class PrivateFilesModule {}
