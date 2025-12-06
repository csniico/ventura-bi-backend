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
}
