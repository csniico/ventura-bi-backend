import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { CreateGoogleUserDto } from 'src/user/dto/create-google-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService
  ) { }

  async validateGoogleUser(googleUser: CreateGoogleUserDto) {
    const { email, googleId } = googleUser;

    let existingUser = await this.userService.findUserByGoogleId(googleId || "");
    if (existingUser) return existingUser;


    const user = await this.userService.findGoogleUserByEmail(email);
    if (user) return user;

    return await this.userService.createGoogleUser(googleUser);
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
