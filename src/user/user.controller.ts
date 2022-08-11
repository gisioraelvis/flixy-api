import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  // Return all users
  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.userService.findAll(paginationQuery);
  }

  // Find a user by email
  @Get(':email')
  findOne(@Param('email') email: string) {
    return this.userService.findOne(email);
  }

  // Create a new user
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // Update user details
  @Patch(':email')
  @HttpCode(202)
  update(@Param('email') email: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(email, updateUserDto);
  }

  // Delete user
  @Delete(':email')
  @HttpCode(202)
  remove(@Param('email') email: string) {
    return this.userService.remove(email);
  }
}
