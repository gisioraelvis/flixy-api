import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { CommonModule } from 'src/common/common.module';
import { PasswordService } from 'src/authentication/passwordHashing.service';

@Module({
  imports: [CommonModule],
  controllers: [UsersController],
  providers: [UserService, PasswordService],
  exports: [UserModule, UserService],
})
export class UserModule {}
