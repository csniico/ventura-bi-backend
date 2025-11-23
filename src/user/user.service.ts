import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BUSINESS_REPOSITORY, USER_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';
import * as bcrypt from "bcrypt";
import { Business } from 'src/business/entities/business.entity';

@Injectable()
export class UserService {

  constructor(
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<User>,

    @Inject(BUSINESS_REPOSITORY)
    private businessRepository: Repository<Business>
  ) { }

  async findGoogleUserByEmail(googleUserEmail: string) {
    const googleUser = this.userRepository.findOne({
      where: { email: googleUserEmail },
      relations: ['ownedBusinesses', 'employerBusiness']
    })
    return googleUser
  }

  async findUserByGoogleId(googleId: string) {
    return await this.userRepository.findOne({
      where: { googleId },
      relations: ['ownedBusinesses', 'employerBusiness']
    });
  }

  async findUserByEmail(userEmail: string, password: boolean = false) {
    if (!password) {
      const user = await this.userRepository.findOne({ where: { email: userEmail } })
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

  async createGoogleUser(createGoogleUserDto: CreateGoogleUserDto, isSystem = false) {
    const { email, firstName, lastName, avatarUrl, googleId } = createGoogleUserDto;
    const newUser = this.userRepository.create({
      email,
      avatarUrl,
      firstName,
      lastName,
      googleId,
      isSystem
    });
    const user = await this.userRepository.save(newUser);

    // For testing purposes, assign the first seeded business as employer
    const existingBusinesses = await this.businessRepository.find();
    if (existingBusinesses.length > 0) {
      user.employerBusiness = existingBusinesses[0];
      user.ownedBusinesses = existingBusinesses.splice(1)
      await this.userRepository.save(user);
    }

    console.log({ user })

    return user
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return this.userRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
