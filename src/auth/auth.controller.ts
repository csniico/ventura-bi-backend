import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Res,
  Body,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import type { Request, Response, CookieOptions } from 'express';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { CreateGoogleUserDto } from 'src/user/dto/create-google-user.dto';
import { User } from 'src/user/entities/user.entity';
import { VerifyCodeDto } from 'src/mail/dto/verify-code.dto';
import { ResendCodeDTO } from 'src/auth/dto/resend-code.dto';
import { ConfirmEmailDto } from 'src/auth/dto/confirm-email.dto';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private frontendRedirectUrl: string | null;
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendRedirectUrl =
      this.configService.get<string>('FRONTEND_REDIRECT_URL') || null;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('/google/login/web')
  googleLoginWeb() {}

  @HttpCode(HttpStatus.OK)
  @Post('/google/login/mobile')
  async googleLoginMobile(
    @Body() createGoogleUser: CreateGoogleUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } =
      await this.authService.validateGoogleUser(createGoogleUser);
    await this.authService.login({ userId: user.id, res });
    return user;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('/google/webhook')
  async webhookGoogleAuth(
    @Req() req: Request & { user?: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!this.frontendRedirectUrl) {
      this.logger.warn('FRONTEND_REDIRECT_URL is not set.');
      throw new InternalServerErrorException('Server configuration error');
    }

    if ('user' in req && req.user) {
      const user = (req.user as { user: User }).user;
      await this.authService.login({ userId: user.id, res });
      return res.redirect(
        `${this.frontendRedirectUrl}?id=${encodeURIComponent(String(user.id))}`,
      );
    }

    return res.redirect(`${this.frontendRedirectUrl}/login?error=auth_failed`);
  }

  @Throttle({
    login: { limit: 15, ttl: 60 * 60 * 1000, blockDuration: 15 * 60 * 1000 },
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  async login(
    @Req() req: Request & { user?: User },
    @Res({ passthrough: true }) res: Response,
  ) {
    if ('user' in req && req.user) {
      const user = req.user;

      await this.authService.login({ userId: user.id, res });
      return user;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/signup')
  async signup(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, shortToken } = await this.authService.signup({
      dto: dto,
      isGoogleUser: false,
    });

    await this.authService.login({ userId: user.id, res });
    if (shortToken) {
      return {
        user,
        shortToken,
      };
    }
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Post('/verify-code')
  async verifyCode(@Body() payload: VerifyCodeDto) {
    return await this.authService.verifyEmailWithCode(payload);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/resend-code')
  async resendCode(@Body() dto: ResendCodeDTO) {
    return await this.authService.resendCode(dto);
  }

  /**
   * confirm email for password reset
   */
  @HttpCode(HttpStatus.OK)
  @Post('/confirm-email')
  confirmEmailAndSendVerificationCode(@Body() dto: ConfirmEmailDto) {
    return this.authService.confirmEmailAndSendVerificationCode(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/reset-password')
  async resetPassword(@Body() body: { newPassword: string; userId: string }) {
    return await this.authService.forgotPassword(body.newPassword, body.userId);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  async logout(
    @Req() req: Request & { user?: { userId: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    if ('user' in req && req.user) {
      const id = req.user.userId;
      await this.authService.signout(id);
    }

    const cookieDomain = this.configService.get<string>('CSRF_COOKIE_DOMAIN');
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    };
    if (cookieDomain && !cookieDomain.includes('localhost')) {
      cookieOptions.domain = cookieDomain;
    }

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }

  @UseGuards(RefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/refresh-token')
  async refreshToken(
    @Req() req: Request & { user?: { userId: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    if ('user' in req && req.user) {
      const id = req.user.userId;

      await this.authService.login({ userId: id, res });
    }
  }
}
