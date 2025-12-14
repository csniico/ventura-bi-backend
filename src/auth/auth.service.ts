import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { CreateGoogleUserDto } from 'src/user/dto/create-google-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { User } from 'src/user/entities/user.entity';
import { SignUpDto } from './dto/signup.dto';
import { MailService } from 'src/mail/mail.service';
import { VerifyCodeDto } from 'src/mail/dto/verify-code.dto';
import { ResendCodeDTO } from 'src/auth/dto/resend-code.dto';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async validateGoogleUser(googleUser: CreateGoogleUserDto) {
    const { googleId } = googleUser;

    const existingUser = await this.userService.findUserByGoogleId(
      googleId || '',
    );
    if (existingUser) return existingUser;

    return await this.userService.createGoogleUser(googleUser, true);
  }

  async validateUserWithEmailAndPassword(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userService.findUserByEmail(email, true);
    if (!user) {
      console.log({ user });
      throw new NotFoundException('User not found');
    }
    // if the user exists but the password is null,
    // the user is google-oauth2.0 authenticated
    if (!user.password && user.googleId) {
      // let them know they are unauthorized
      // they should use their google-accounts to log in
      throw new UnauthorizedException(
        'Invalid credentials. Login with Google.',
      );
    }
    const isPasswordMatch = await this.userService.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { userData: user };
  }

  login(userId: string, user: User & { password?: string }, res: Response) {
    const payload = { sub: userId };
    const token = this.jwtService.sign(payload);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;

    return rest;
  }

  async signupWithEmailAndPassword(signupUser: SignUpDto) {
    try {
      const user: User =
        await this.userService.createUserWithEmailAndPassword(signupUser);
      const { email, firstName } = user;
      const { id } = await this.mailService.sendVerificationCode({
        email,
        firstName,
      });
      return { user, shortToken: id };
    } catch (error) {
      const errorMessage =
        error instanceof QueryFailedError ? error.message : String(error);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async verifyEmailWithCode(dto: VerifyCodeDto) {
    const user = await this.userService.getUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isVerified = await this.mailService.validateVerificationCode({
      ...dto,
      firstName: user.firstName,
    });
    if (!isVerified) {
      throw new UnauthorizedException('Invalid verification credentials');
    }
    return await this.userService.setEmailVerificationState(
      user.id,
      user.email,
      true,
    );
  }

  async resendCode(dto: ResendCodeDTO) {
    const mail = await this.mailService.getMailById(dto.id);
    if (!mail) {
      throw new NotFoundException('Email not found');
    }
    const { to: email } = mail;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      return new NotFoundException('user does not exist');
    }
    const { firstName } = user;
    return await this.mailService.sendVerificationCode({ email, firstName });
  }
}
