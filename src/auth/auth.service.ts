import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import type { Response, CookieOptions } from 'express';
import { MailService } from 'src/mail/mail.service';
import { VerifyCodeDto } from 'src/mail/dto/verify-code.dto';
import { ResendCodeDTO } from 'src/auth/dto/resend-code.dto';
import { ConfigService } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import refreshJwtConfig from './config/refresh-jwt.config';
import * as argon2 from 'argon2';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthLoginEvent, AuthLogoutEvent } from 'src/audit/events/auth-events';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private csrfDomain: string | null;
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {
    this.csrfDomain = configService.get<string>('CSRF_COOKIE_DOMAIN') || null;
    this.logger.debug(`CSRF_COOKIE_DOMAIN set to: ${this.csrfDomain}`);
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);
    return { access_token, refresh_token };
  }

  async verifyJwtPayload({ userId }: { userId: string }) {
    return await this.userService.verifyUserId(userId);
  }

  async verifyRefreshToken({
    userId,
    refreshToken,
  }: {
    userId: string;
    refreshToken: string;
  }) {
    return await this.userService.verifyUserRefreshToken({
      userId,
      refreshToken,
    });
  }

  async validateGoogleUser(dto: CreateUserDto) {
    return await this.signup({ dto, isGoogleUser: true });
  }

  async signInWithEmailPassword(loginDto: LoginDto) {
    const { email, password } = loginDto;
    return await this.userService.handleUserSignIn({ email, password });
  }

  async login({
    userId,
    res,
    email,
  }: {
    userId: string;
    res: Response;
    email?: string;
  }) {
    const { access_token, refresh_token } = await this.generateTokens(userId);

    const hashedRefreshToken = await argon2.hash(refresh_token);

    await this.userService.updateUserRefreshToken({
      userId: userId,
      hashedRefreshToken: hashedRefreshToken,
    });

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      // MUST be true if SameSite is 'none'.
      // For local dev calling a remote API, both need to be True/None.
      secure: true,
      sameSite: isProduction ? 'lax' : 'none',
      path: '/',
    };

    // Only set domain in production.
    // If developers are on localhost, setting a .site domain will prevent the browser from saving it.
    if (isProduction && this.csrfDomain) {
      cookieOptions.domain = this.csrfDomain;
    }

    res.cookie('access_token', access_token, cookieOptions);
    res.cookie('refresh_token', refresh_token, cookieOptions);

    this.eventEmitter.emit('auth.login', {
      userId,
      email: email ?? '',
      success: true,
      timestamp: new Date(),
    } as AuthLoginEvent);
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
      const result = await this.mailService.sendVerificationCode({
        email: dto.email,
        firstName: dto.firstName,
        status: 'NEW',
      });
      return {
        user: await this.userService.findUserById(user.id),
        shortToken: result.id,
      };
    } else if (status === 'EXISTING_USER') {
      // send login attempt email verification
      const result = await this.mailService.sendVerificationCode({
        email: dto.email,
        firstName: dto.firstName,
        status: 'EXISTING',
      });
      return {
        user: await this.userService.findUserById(user.id),
        shortToken: result.id,
      };
    }

    return {
      user: await this.userService.findUserById(user.id),
      shortToken: null,
    };
  }

  async signout(userId: string) {
    await this.userService.updateUserRefreshToken({
      userId,
      hashedRefreshToken: null,
    });

    this.eventEmitter.emit('auth.logout', {
      userId,
      email: '',
      timestamp: new Date(),
    } as AuthLogoutEvent);
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
      // A wrong/stale verification code is a client input error, not a session
      // (401) failure. Returning 400 keeps clients from mistaking it for an
      // expired session and triggering a token refresh.
      throw new BadRequestException('Invalid verification credentials');
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
