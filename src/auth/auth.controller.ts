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
import type { Response } from 'express';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { CreateGoogleUserDto } from 'src/user/dto/create-google-user.dto';
import { User } from 'src/user/entities/user.entity';
import { VerifyCodeDto } from 'src/mail/dto/verify-code.dto';
import { ResendCodeDTO } from 'src/auth/dto/resend-code.dto';
import { ConfirmEmailDto } from 'src/auth/dto/confirm-email.dto';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

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
    const user = await this.authService.validateGoogleUser(createGoogleUser);
    this.authService.login({ userId: user.id, res });
    return user;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('/google/webhook')
  webhookGoogleAuth(
    @Req() req: Request & { user?: User },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!this.frontendRedirectUrl) {
      this.logger.warn('FRONTEND_REDIRECT_URL is not set.');
      throw new InternalServerErrorException('Server configuration error');
    }

    if ('user' in req && req.user) {
      const user = req.user;
      this.authService.login({ userId: user.id, res });
      return res.redirect(
        `${this.frontendRedirectUrl}?id=${encodeURIComponent(JSON.stringify(user.id))}`,
      );
    }

    return res.redirect(`${this.frontendRedirectUrl}/login?error=auth_failed`);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  login(
    @Req() req: Request & { user?: User },
    @Res({ passthrough: true }) res: Response,
  ) {
    if ('user' in req && req.user) {
      const user = req.user;

      this.authService.login({ userId: user.id, res });
      return user;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/signup')
  async signup(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.signup({
      dto: dto,
      isGoogleUser: false,
    });

    this.authService.login({ userId: user.id, res });
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

  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  logout() {}
}
