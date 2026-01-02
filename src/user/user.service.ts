import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { USER_REPOSITORY } from 'src/constants';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';
import * as bcrypt from 'bcrypt';
import { GetUsersDto } from './dto/get-users.dto';
import { log } from 'console';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<User>,
  ) {}

  async validateUserId(userId: string) {
    if (!userId) {
      return false;
    }
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(userId)) {
      return false;
    }
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id'],
    });
    if (!user) {
      log('user not found in validateUserId');
      return false;
    }
    log('user found in validateUserId');
    return true;
  }

  async saveUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  async findUserById(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is expected.');
    }
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(userId)) {
      throw new BadRequestException('userId must be a valid UUID v4.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['business'],
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async getUserByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('email is expected.');
    }
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['business'],
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async findAllUsers(getusersDto: GetUsersDto) {
    const { limit = 10, offset = 0 } = getusersDto;
    const [users, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: offset,
    });

    return {
      data: users,
      total,
      limit,
      offset,
      nextPage: total > offset + limit ? offset + limit : null,
    };
  }

  async findGoogleUserByEmail(googleUserEmail: string) {
    return this.userRepository.findOne({
      where: { email: googleUserEmail },
    });
  }

  async findUserByGoogleId(googleId: string) {
    return await this.userRepository.findOne({
      where: { googleId },
      relations: ['business'],
    });
  }

  async findUserByEmail(userEmail: string, password: boolean = false) {
    if (!password) {
      return await this.userRepository.findOne({
        where: { email: userEmail },
        relations: ['business'],
      });
    }

    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.business', 'business')
      .addSelect('user.password')
      .where('user.email = :email', { email: userEmail })
      .getOne();
  }

  async comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }

  async hashPassword(password: string) {
    if (!password) throw new Error('Password cannot be an empty string');
    try {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    } catch (error: any) {
      console.error(error);
      throw new Error('Failed to hash password');
    }
  }

  async createGoogleUser(
    createGoogleUserDto: CreateGoogleUserDto,
    isSystem = false,
  ) {
    const { email, firstName, lastName, avatarUrl, googleId } =
      createGoogleUserDto;
    const newUser = this.userRepository.create({
      email,
      avatarUrl,
      firstName,
      lastName,
      googleId,
      isSystem,
      isEmailVerified: true,
    });
    return await this.userRepository.save(newUser);
  }

  async createUserWithEmailAndPassword(createUser: CreateUserDto) {
    const { email, password, firstName, lastName, avatarUrl } = createUser;
    if (!password) {
      throw new BadRequestException('Password is required');
    }
    try {
      const hashedPassword = await this.hashPassword(password);
      const newUser = this.userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName: lastName || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      return await this.userRepository.save(newUser);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        if (
          error.message.includes(
            'duplicate key value violates unique constraint',
          )
        )
          throw new ConflictException('User already exists');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async setEmailVerificationState(userId: string, email: string, state = true) {
    if (!userId) {
      throw new BadRequestException('userId is expected.');
    }
    if (!email) {
      throw new BadRequestException('email is expected.');
    }
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, email: email },
        relations: ['business'],
      });
      if (!user) {
        return new NotFoundException('User not found.');
      }
      user.isEmailVerified = state;
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database error occurred.');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async updateUserProfile({
    firstName,
    userId,
    lastName,
    avatarUrl,
  }: {
    firstName: string;
    userId: string;
    lastName?: string;
    avatarUrl?: string;
  }) {
    try {
      if (!firstName) {
        return new BadRequestException('firstName is expected.');
      }
      if (!userId) {
        return new BadRequestException('userId is expected.');
      }
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['business'],
      });
      if (!user) {
        return new NotFoundException('User not found.');
      }
      user.firstName = firstName;
      if (lastName !== undefined) {
        user.lastName = lastName;
      }
      if (avatarUrl !== undefined) {
        user.avatarUrl = avatarUrl;
      }
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database error occurred.');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async updatePassword(
    oldPassword: string,
    newPassword: string,
    userId: string,
  ) {
    try {
      if (!oldPassword) {
        return new BadRequestException('oldPassword is expected.');
      }
      if (!newPassword) {
        return new BadRequestException('newPassword is expected.');
      }
      if (!userId) {
        return new BadRequestException('userId is expected.');
      }
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('password')
        .where('user.id = :id', { id: userId })
        .leftJoinAndSelect('user.business', 'business')
        .getOne();
      if (!user) {
        return new NotFoundException('User not found.');
      }
      const isPasswordMatch = await this.comparePassword(
        oldPassword,
        user.password,
      );
      if (!isPasswordMatch) {
        return new BadRequestException('Old password does not match.');
      }
      user.password = await this.hashPassword(newPassword);
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database error occurred.');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async resetPassword(newPassword: string, userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is expected.');
    }
    if (!newPassword) {
      throw new BadRequestException('newPassword is expected.');
    }

    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['business'],
      });
      if (!user) {
        return new NotFoundException('User not found.');
      }
      user.password = await this.hashPassword(newPassword);
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database error occurred.');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async deleteUser(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is expected.');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return await this.userRepository.remove(user);
  }
}
