import { Controller, Get, Post, UseGuards, Request, Req, HttpCode, HttpStatus, Res, Query, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import type { Response } from 'express';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { CreateGoogleUserDto } from 'src/user/dto/create-google-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  @UseGuards(GoogleAuthGuard)
  @Get('/google/login')
  googleLogin() { }


  @UseGuards(GoogleAuthGuard)
  @Get('/google/webhook')
  webhookGoogleAuth(@Req() req) {
    const user = req.user;
    console.log({ user })
    return {
      message: 'Google authentication successful',
      user: req.user
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  login(@Req() req, @Res({ passthrough: true }) res: Response) {

    return this.authService.login(req.user.userData.id, req.user.userData, res)
  }

  @HttpCode(HttpStatus.OK)
  @Post('/mobile/signin')
  googleSignInMobile(@Body() createGoogleUser: CreateGoogleUserDto) {
    return this.authService.validateGoogleUser(createGoogleUser)
  }
}
