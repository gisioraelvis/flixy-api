import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { CommonModule } from 'src/common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PasswordService } from 'src/auth/password.service';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UserService, PasswordService],
  exports: [UserModule, UserService],
})
export class UserModule {}
