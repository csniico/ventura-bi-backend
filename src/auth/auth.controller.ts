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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import type { Response } from 'express';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { CreateGoogleUserDto } from 'src/user/dto/create-google-user.dto';
import { User } from 'src/user/entities/user.entity';
import { SignUpDto } from './dto/signup.dto';
import { VerifyCodeDto } from 'src/mail/dto/verify-code.dto';
import { ResendCodeDTO } from 'src/auth/dto/resend-code.dto';
import { ConfirmEmailDto } from 'src/auth/dto/confirm-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(GoogleAuthGuard)
  @Get('/google/login/web')
  googleLoginWeb() {}

  @HttpCode(HttpStatus.OK)
  @Post('/google/login/mobile')
  googleLoginMobile(@Body() createGoogleUser: CreateGoogleUserDto) {
    return this.authService.validateGoogleUser(createGoogleUser);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('/google/webhook')
  webhookGoogleAuth(@Req() req: Request & { user?: User }) {
    if ('user' in req && req.user) {
      const user = req.user;
      return {
        message: 'Google authentication successful',
        user: user,
      };
    }
    return null;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  login(
    @Req() req: Request & { user?: { userData: User } },
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if ('user' in req && req.user) {
      return this.authService.login(
        req.user.userData.id,
        req.user.userData,
        res,
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('/signup')
  async signup(@Body() signUpUser: SignUpDto) {
    return await this.authService.signupWithEmailAndPassword(signUpUser);
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
