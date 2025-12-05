import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { BUSINESS_REPOSITORY, USER_REPOSITORY } from 'src/constants';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';
import * as bcrypt from 'bcrypt';
import { Business } from 'src/business/entities/business.entity';
import { GetUsersDto } from './dto/get-users.dto';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<User>,

    @Inject(BUSINESS_REPOSITORY)
    private businessRepository: Repository<Business>,

    private mailerService: MailerService,
  ) { }

  async findUserById(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is expected.');
    }
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      return user;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database error occurred.');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
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
      nextpage: total > offset + limit ? offset + limit : null,
    };
  }

  async findGoogleUserByEmail(googleUserEmail: string) {
    const googleUser = this.userRepository.findOne({
      where: { email: googleUserEmail },
      relations: ['ownedBusinesses', 'employerBusiness'],
    });
    return googleUser;
  }

  async findUserByGoogleId(googleId: string) {
    return await this.userRepository.findOne({
      where: { googleId },
      relations: ['ownedBusinesses', 'employerBusiness'],
    });
  }

  async findUserByEmail(userEmail: string, password: boolean = false) {
    if (!password) {
      const user = await this.userRepository.findOne({
        where: { email: userEmail },
      });
      return user;
    }
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: userEmail })
      .getOne();
    return user;
  }

  async comparePassword(password: string, hash: string) {
    const isPasswordMatch = await bcrypt.compare(password, hash);
    return isPasswordMatch;
  }

  async hashPassword(password: string) {
    if (!password) throw new Error('Password cannot be an empty string');
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
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
      isEmailVerified: true
    });
    const user = await this.userRepository.save(newUser);
    return user;
  }

  async createUserWithEmailAndPassword(createUser: CreateUserDto) {
    try {
      const { email, password, firstName, lastName, avatarUrl } = createUser;
      if (!password) {
        throw new BadRequestException('Password is required');
      }
      const hashedPassword = await this.hashPassword(password);
      const newUser = this.userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName: lastName || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      const user = await this.userRepository.save(newUser);
      await this.mailerService.sendVerificationEmail(user.firstName, user.email);
      return user;
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
      const user = await this.userRepository.findOne({ where: { id: userId, email: email } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      user.isEmailVerified = state ? true : false;
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database error occurred.');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async updateAvatarUrl(avatarUrl: string, userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is expected.');
      }
      if (!avatarUrl) {
        throw new BadRequestException('avatarurl is expected.');
      }
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      user.avatarUrl = avatarUrl;
      await this.userRepository.save(user);
      return user;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Database error occurred.');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async updateFirstnameAndLastname(
    firstname: string,
    userId: string,
    lastname?: string,
  ) {
    try {
      if (!firstname) {
        throw new BadRequestException('firstname is expected.');
      }
      if (!userId) {
        throw new BadRequestException('userId is expected.');
      }
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      user.firstName = firstname;
      if (lastname !== undefined) {
        user.lastName = lastname;
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
    newpassword: string,
    userId: string,
  ) {
    try {
      if (!oldPassword) {
        throw new BadRequestException('oldPassword is expected.');
      }
      if (!newpassword) {
        throw new BadRequestException('newpassword is expected.');
      }
      if (!userId) {
        throw new BadRequestException('userId is expected.');
      }
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('password')
        .where('user.id = :id', { id: userId })
        .getOne();
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      const isPasswordMatch = await this.comparePassword(
        oldPassword,
        user.password,
      );
      if (!isPasswordMatch) {
        throw new BadRequestException('Old password does not match.');
      }
      user.password = await this.hashPassword(newpassword);
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
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found.');
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
}
