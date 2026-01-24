import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  private getUserId(req: { user: { userId: string } }): string | null {
    if ('userId' in req.user) {
      return req.user.userId;
    } else {
      return null;
    }
  }

  @Get('/summary')
  async getDashboardSummary(
    @Req() req: { user: { userId: string } },
    @Query('businessId') businessId: string,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException('User not authorized');
    }

    if (!businessId) {
      throw new UnauthorizedException('Business ID is required');
    }

    return await this.dashboardService.getDashboardSummary({
      businessId,
      ownerId,
    });
  }
}
