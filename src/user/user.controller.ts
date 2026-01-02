import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@Query() getusersDto: GetUsersDto) {
    return await this.userService.findAllUsers(getusersDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:userId')
  async getUserById(@Param('userId') userId: string, @Req() req: Request) {
    const jwtId = req.user && 'userId' in req.user ? req.user.userId : null;
    console.log('JWT ID:', jwtId);
    if (jwtId !== userId) {
      throw new BadRequestException(
        'You are not authorized to access this user data',
      );
    }
    return await this.userService.findUserById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/profile/:userId/')
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const { firstName, lastName, avatarUrl } = updateProfileDto;
    if (!firstName || !userId) {
      throw new BadRequestException('firstName and userId are required');
    }

    return await this.userService.updateUserProfile({
      firstName,
      userId,
      lastName,
      avatarUrl,
    });
  }

  @Post('/:userId/change-password')
  async changePassword(
    @Param('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const { oldPassword, newPassword } = changePasswordDto;
    if (!oldPassword || !newPassword || !userId) {
      throw new BadRequestException(
        'oldPassword, newPassword and userId are required',
      );
    }
    return await this.userService.updatePassword(
      oldPassword,
      newPassword,
      userId,
    );
  }

  @Post('/:userId/reset-password')
  async resetPassword(
    @Param('userId') userId: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    const { newPassword } = resetPasswordDto;
    if (!newPassword || !userId) {
      throw new BadRequestException('newPassword and userId are required');
    }
    return await this.userService.resetPassword(newPassword, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteUser(@Param('id') userId: string) {
    return await this.userService.deleteUser(userId);
  }
}
