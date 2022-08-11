import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PasswordService } from 'src/auth/passwordHashing.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma, User, UserStatus } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  /**
   * Create a new user
   * @params userDto - email, phoneNumber, password
   * @returns {Promise<User>} - created user
   */
  async create(userDto: CreateUserDto): Promise<User> {
    const { email, phoneNumber } = userDto;

    const userEmail = await this.prisma.user.findUnique({ where: { email } });
    // Email already registered
    if (userEmail) {
      throw new ConflictException('Email is already registered');
    }

    const userPhoneNumber = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });
    // Phone number already registered
    if (userPhoneNumber) {
      throw new ConflictException('Phone Number is already registered');
    }

    // hash the password before
    const hashedPassword = await this.passwordService.hashPassword(
      userDto.password,
    );
    userDto.password = hashedPassword;

    // Create user
    const newUser = await this.prisma.user.create({
      data: {
        ...userDto,
      },
    });

    return newUser;
  }

  /**
   * Return all Users
   * @returns {Promise<User[]>}
   */
  async findAll(paginationQuery: {
    offset?: number;
    limit?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { offset, limit, cursor, where, orderBy } = paginationQuery;
    return this.prisma.user.findMany({
      skip: offset,
      take: limit,
      cursor,
      where,
      orderBy,
    });
  }

  /**
   * Find a user by email
   * @param email
   * @returns {Promise<User>} - User
   */
  async findOne(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }
    return user;
  }

  /**
   * Update user details
   * @params email and UpdateUserDto
   * @returns {Promise<User>} - updated user
   */
  async update(email: string, userDto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    const userEmail = await this.prisma.user.findUnique({
      where: { email: userDto.email },
    });
    //Check if the new provided email is already registered by another user
    if (userEmail && userEmail.id !== user.id) {
      throw new ConflictException('Email is already registered');
    }

    // Check if the phone number is already registered by another user
    const userPhoneNumber = await this.prisma.user.findUnique({
      where: { phoneNumber: userDto.phoneNumber },
    });
    if (userPhoneNumber && userPhoneNumber.id !== user.id) {
      throw new ConflictException('Phone Number is already registered');
    }

    // Prevent updating the user password - only the user should update his password
    delete userDto.password;

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        ...userDto,
      },
    });

    return updatedUser;
  }

  /**
   * Update user password
   * @param email
   * @param newPassword
   * @returns {Promise<User>} - Updated user
   */
  async updatePassword(email: string, newPassword: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    // Hash the new password
    const hashedNewPassword = await this.passwordService.hashPassword(
      newPassword,
    );

    // Update password in the database
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { password: hashedNewPassword },
    });

    return updatedUser;
  }

  /**
   * Mark email as confirmed
   * @param email
   * @returns {Promise<User>} - Updated user
   */
  async markEmailAsConfirmed(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    // update user email confirmed to true and status to active
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { isEmailConfirmed: true, status: UserStatus.ACTIVE },
    });

    return updatedUser;
  }

  /**
   * Mark email as confirmed
   * @param email
   * @returns {Promise<User>} - Updated user
   */
  async markPhoneNumberConfirmed(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    // Update user phone isPhoneNumberConfirmed to true and userStatus to active
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        isPhoneNumberConfirmed: true,
        status: UserStatus.ACTIVE,
      },
    });

    return updatedUser;
  }

  /**
   * Delete a user
   * @param email - user email
   * @returns {Promise<any>} - user deleted message
   */
  async remove(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    // Delete user
    await this.prisma.user.delete({ where: { email } });

    return {
      statusCode: 200,
      message: 'User deleted',
    };
  }

  /**
   * Gets all user private files
   * @param userId
   * @returns {Promise<any>}
   */
  async getAllPrivateFiles(
    userId: number,
    paginationQuery: {
      offset?: number;
      limit?: number;
      cursor?: Prisma.SingleMovieWhereUniqueInput;
      orderBy?: Prisma.SingleMovieOrderByWithRelationInput;
    },
  ): Promise<any> {
    const { offset, limit, cursor, orderBy } = paginationQuery;
    // one user can have multiple files - user - privateFiles is a 1:n relationship
    const files = await this.prisma.privateFile.findMany({
      where: { owner: { id: userId } },
      skip: offset,
      take: limit,
      cursor,
      orderBy,
    });
    return files;
  }
}
