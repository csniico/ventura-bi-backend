import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserService } from 'src/user/user.service';
import { CreateGoogleUserDto } from 'src/user/dto/create-google-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) { }

  async validateGoogleUser(googleUser: CreateGoogleUserDto) {
    const { email, googleId } = googleUser;

    let existingUser = await this.userService.findUserByGoogleId(googleId || "");
    if (existingUser) return existingUser;


    const user = await this.userService.findGoogleUserByEmail(email);
    if (user) return user;

    return await this.userService.createGoogleUser(googleUser);
  }

  async validateUserWithEmailAndPassword(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userService.findUserByEmail(email, true);
    if (!user) {
      console.log({ user })
      throw new NotFoundException('User not found');
    }
    // if the user exists but the password is null, 
    // the user is google oauth2.0 authenticated
    if (!user.password && user.googleId) {
      // let them know they are unauthorized
      // they should use their google accounts to log in
      throw new UnauthorizedException('Invalid credentials. Login with Google.');
    }
    const isPasswordMatch = await this.userService.comparePassword(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { userData: user };
  }

  login(userId: string, user: any, res: Response) {
    const payload = { sub: userId };
    const token = this.jwtService.sign(payload);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })

    delete user.password;
    return { user }
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
