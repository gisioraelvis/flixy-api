import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordService } from 'src/auth/password.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserAccountStatus } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  /**
   * Create a new user
   * @params userDto - email, phoneNumber, password
   * @returns {Promise<User>} - created user
   */
  async create(userDto: CreateUserDto): Promise<User | any> {
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
  async findAll(): Promise<User[] | any> {
    return await this.prisma.user.findMany();
  }

  /**
   * Find a user by email
   * @param email
   * @returns {Promise<User>} - User
   */
  async findOne(email: string): Promise<User | any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Update user details
   * @params email and UpdateUserDto
   * @returns {Promise<User>} - updated user
   */
  async update(email: string, userDto: UpdateUserDto): Promise<User | any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
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
   * @returns {Promise<User | any>} - Updated user
   */
  async updatePassword(
    email: string,
    newPassword: string,
  ): Promise<User | any> {
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
  async markEmailAsConfirmed(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // update user email confirmed to true and status to verified
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { isEmailConfirmed: true, status: UserAccountStatus.VERIFIED },
    });

    return updatedUser;
  }

  /**
   * Mark email as confirmed
   * @param email
   * @returns {Promise<User>} - Updated user
   */
  async markPhoneNumberConfirmed(email: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user phone isPhoneNumberConfirmed to true and userStatus to verified
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        isPhoneNumberConfirmed: true,
        status: UserAccountStatus.VERIFIED,
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
  async getAllPrivateFiles(userId: number): Promise<any> {
    // one user can have multiple files
    const files = await this.prisma.private_file.findMany({
      where: { id: userId },
    });
    return files;
  }
}
