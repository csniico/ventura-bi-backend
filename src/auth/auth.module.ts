import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PermissionModule } from 'src/permission/permission.module';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [PermissionModule],
  controllers: [AuthController],
  providers: [AuthService, PermissionsGuard],
})
export class AuthModule {}
