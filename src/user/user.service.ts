import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   * @param createUserDto - email, phoneNumber, password
   * @returns {Promise<User>}
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, phoneNumber } = createUserDto;
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
    const newUser = await this.userRepository.create(createUserDto);
    await this.userRepository.save(newUser);
    return newUser;
  }

  /**
   * Returns all users
   * @returns {Promise<User[]>}
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  /**
   * Finds a user by email
   * @param email
   * @returns {Promise<User>}
   */
  async findOne(email: string): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Updates user details
   * @param email
   * @param updateUserDto
   * @returns {Promise<User>}
   */
  async update(email: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.update({ email }, updateUserDto);
    const updatedUser = await this.userRepository.findOne(user.id);
    return updatedUser;
  }

  /**
   * Deletes a user
   * @param email
   */
  async remove(email: string) {
    const deletedUser = await this.userRepository.delete({ email });
    // User doesn't exist
    if (!deletedUser.affected) {
      throw new NotFoundException('User not found');
    }
    return HttpStatus.ACCEPTED;
  }
}
