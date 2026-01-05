import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { USER_REPOSITORY } from 'src/constants';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

type CreateUserResult = {
  status: 'NEW_USER' | 'EXISTSING_USER' | 'EXISTING_GOOGLE_USER';
  user: User;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<User>,
  ) {}

  private async comparePassword(password: string, hash: string) {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      return isMatch;
    } catch (error) {
      this.logger.error('An error occurred while comparing passwords', error);
      return false;
    }
  }

  private async hashPassword(password: string) {
    if (!password) {
      this.logger.error('Password is empty or undefined');
      throw new InternalServerErrorException('An unexpected error occurred.');
    }
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error: any) {
      this.logger.error('Error hashing password', error);
      throw new InternalServerErrorException('An unexpected error occurred.');
    }
  }

  private validateUserSignup({
    isGoogleUser,
    user,
  }: {
    user: User;
    isGoogleUser: boolean;
  }): CreateUserResult {
    if (!isGoogleUser) {
      return {
        status: 'EXISTSING_USER',
        user,
      };
    }
    return {
      status: 'EXISTING_GOOGLE_USER',
      user,
    };
  }

  private async createNewUser({
    dto,
    isGoogleUser,
  }: {
    dto: CreateUserDto;
    isGoogleUser: boolean;
  }): Promise<CreateUserResult> {
    const newUser = this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatarUrl: dto.avatarUrl,
    });

    if (isGoogleUser && dto.googleId) {
      newUser.googleId = dto.googleId;
      newUser.isEmailVerified = true;
      newUser.isSystem = true;
    } else if (dto.password && dto.password.length > 12) {
      const hashedPassword = await this.hashPassword(dto.password);
      newUser.password = hashedPassword;
      newUser.isSystem = true;
    }
    return {
      status: 'NEW_USER',
      user: await this.userRepository.save(newUser),
    };
  }

  private async getUserByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async saveUser(user: User) {
    if (!user) {
      throw new InternalServerErrorException();
    }
    return await this.userRepository.save(user);
  }

  async findUserByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('email is expected.');
    }
    return await this.getUserByEmail(email);
  }

  async verifyUserId(userId: string) {
    if (!userId) {
      this.logger.warn(
        'findUserById failed because id was empty|null|undefined',
      );
      throw new UnauthorizedException();
    }

    const exists = await this.userRepository.exists({
      where: { id: userId },
    });
    return exists;
  }

  async findUserById(userId: string) {
    if (!userId) {
      this.logger.warn(
        'findUserById failed because id was empty|null|undefined',
      );
      throw new UnauthorizedException();
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

  async handleUserSignIn({
    email,
    password,
  }: {
    email: string;
    password?: string;
  }) {
    if (!password) {
      throw new BadRequestException('Password is required.');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      await this.comparePassword('password', 'hash'); // Mitigation for timing attacks
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return user;
  }

  async verifyPassword({ password, hash }: { password: string; hash: string }) {
    return await this.comparePassword(password, hash);
  }

  async createUser({
    dto,
    isGoogleUser,
  }: {
    dto: CreateUserDto;
    isGoogleUser: boolean;
  }): Promise<CreateUserResult> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      return await this.createNewUser({ dto, isGoogleUser });
    }
    return this.validateUserSignup({ user, isGoogleUser });
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
