import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { MailService } from 'src/mail/mail.service';
import { VerifyCodeDto } from 'src/mail/dto/verify-code.dto';
import { ResendCodeDTO } from 'src/auth/dto/resend-code.dto';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private csrfDomain: string | null;
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.csrfDomain = configService.get<string>('CSRF_COOKIE_DOMAIN') || null;
  }

  async verifyJwtPayload({ userId }: { userId: string }) {
    return await this.userService.verifyUserId(userId);
  }

  async validateGoogleUser(dto: CreateUserDto) {
    return await this.signup({ dto, isGoogleUser: true });
  }

  async signInWithEmailPassword(loginDto: LoginDto) {
    const { email, password } = loginDto;
    return await this.userService.handleUserSignIn({ email, password });
  }

  login({ userId, res }: { userId: string; res: Response }) {
    const payload = { sub: userId };
    const token = this.jwtService.sign(payload);

    if (!this.csrfDomain) {
      this.logger.warn('CSRF_COOKIE_DOMAIN is not set.');
      throw new InternalServerErrorException('Server configuration error');
    }

    return res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: this.csrfDomain,
      maxAge: 1000 * 60 * 60 * 24,
    });
  }

  async signup({
    dto,
    isGoogleUser = false,
  }: {
    dto: CreateUserDto;
    isGoogleUser: boolean;
  }) {
    const { status, user } = await this.userService.createUser({
      dto,
      isGoogleUser,
    });

    // debug log
    this.logger.debug(
      `Signup process for email: ${dto.email} resulted in status: ${status}`,
    );
    if (status === 'NEW_USER') {
      // send sign up verification code
      await this.mailService.sendVerificationCode({
        email: dto.email,
        firstName: dto.firstName,
        status: 'NEW',
      });
    } else if (status === 'EXISTING_USER') {
      // send login attempt email verification
      await this.mailService.sendVerificationCode({
        email: dto.email,
        firstName: dto.firstName,
        status: 'EXISTING',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async confirmEmailAndSendVerificationCode(email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { firstName } = user;
    return await this.mailService.sendVerificationCode({
      email,
      firstName,
      status: 'NEW',
    });
  }

  async verifyEmailWithCode(dto: VerifyCodeDto) {
    const user = await this.userService.findUserByEmail(dto.email);
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
      throw new BadRequestException();
    }
    const { to: email } = mail;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException();
    }
    const { firstName } = user;
    return await this.mailService.sendVerificationCode({
      email,
      firstName,
      status: 'EXISTING',
    });
  }

  async forgotPassword(newPassword: string, userId: string) {
    return await this.userService.resetPassword(newPassword, userId);
  }
}
