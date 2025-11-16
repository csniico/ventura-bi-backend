import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USER_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';

@Injectable()
export class UserService {

  constructor(
    @Inject(USER_REPOSITORY)
    private userRepository: Repository<User>
  ) { }

  async findGoogleUserByEmail(googleUserEmail: string) {
    const googleUser = this.userRepository.findOne({ where: { email: googleUserEmail } })
    return googleUser
  }

  async findUserByGoogleId(googleId: string) {
    return await this.userRepository.findOne({ where: { googleId } });
  }

  async findUserByEmail(userEmail: string) {
    const user = await this.userRepository.findOne({ where: { email: userEmail } })
    return user;
  }

  async createGoogleUser(createGoogleUserDto: CreateGoogleUserDto) {
    const { email, firstName, lastName, avatarUrl, googleId } = createGoogleUserDto;
    const user = this.userRepository.create({
      email,
      avatarUrl,
      firstName,
      lastName,
      googleId
    })
    return await this.userRepository.save(user);
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
