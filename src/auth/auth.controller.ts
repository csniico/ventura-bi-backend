import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequirePermissions } from './decorators/require-permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';

@Controller('auth')
@UseGuards(PermissionsGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @RequirePermissions('read:auth')
  @HttpCode(202)
  @Get('')
  getAuthRoot() {
    return {
      message: 'Auth Service is running',
    };
  }
}
