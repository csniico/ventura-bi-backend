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
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateNameDto } from './dto/update-name.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetUsersDto } from './dto/get-users.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@Query() getusersDto: GetUsersDto) {
    return await this.userService.findAllUsers(getusersDto);
  }

  @Get('/:userId')
  async getUserById(@Param('userId') userId: string) {
    return await this.userService.findUserById(userId);
  }

  @Patch('/:userId/avatar')
  async updateAvatarUrl(
    @Param('userId') userId: string,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ) {
    const { avatarUrl } = updateAvatarDto;
    if (!avatarUrl || !userId) {
      throw new BadRequestException('avatarUrl and userId are required');
    }
    return await this.userService.updateAvatarUrl(avatarUrl, userId);
  }

  @Patch('/:userId/name')
  async updateFirstnameAndLastname(
    @Param('userId') userId: string,
    @Body() updateNameDto: UpdateNameDto,
  ) {
    const { firstName, lastName } = updateNameDto;
    if (!firstName || !userId) {
      throw new BadRequestException('firstName and userId are required');
    }

    return await this.userService.updateFirstnameAndLastname(
      firstName,
      userId,
      lastName,
    );
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

  @Delete('/:id')
  async deleteUser(@Param('id') userId: string) {
    return await this.userService.deleteUser(userId);
  }
}
