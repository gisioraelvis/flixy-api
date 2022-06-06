import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserAccountStatus } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   * @params userDto - email, phoneNumber, password
   * @returns User object
   */
  async create(userDto: CreateUserDto): Promise<User> {
    const { email, phoneNumber } = userDto;
    const userEmail = await this.userRepository.findOne({ email });

    // Email already registered
    if (userEmail) {
      throw new ConflictException('Email is already registered');
    }
    // Phone number already registered
    const userPhoneNumber = await this.userRepository.findOne({ phoneNumber });
    if (userPhoneNumber) {
      throw new ConflictException('Phone Number is already registered');
    }
    const newUser = this.userRepository.create(userDto);
    await this.userRepository.save(newUser);
    return newUser;
  }

  /**
   * Return all users
   * @returns {Promise<User[]>}
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Find a user by email
   * @param email
   * @returns {Promise<User>} - user
   */
  async findOne(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
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
  async update(email: string, userDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.update({ email }, userDto);
    const updatedUser = await this.userRepository.findOne(user.id);
    return updatedUser;
  }

  /**
   * Update user password
   * @param email
   * @param newPassword
   * @returns {Promise<User | any>} - updated user or error message
   */
  async updatePassword(
    email: string,
    newPassword: string,
  ): Promise<User | any> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }
    // Update password in the database - don't use update method of typeorm(din't work with bcrypt)
    user.password = newPassword;
    await this.userRepository.save(user);
    return await this.userRepository.findOne(user.id);
  }

  /**
   * Mark email as confirmed
   * @param email
   * @returns Boolean
   */
  async markEmailAsConfirmed(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isEmailConfirmed = true;
    // update user status to verified
    user.status = UserAccountStatus.VERIFIED;
    await this.userRepository.save(user);
    return true;
  }

  /**
   * Delete a user
   * @param email
   */
  async remove(email: string) {
    const deletedUser = await this.userRepository.delete({ email });
    // User doesn't exist
    if (!deletedUser.affected) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted' };
  }
}
