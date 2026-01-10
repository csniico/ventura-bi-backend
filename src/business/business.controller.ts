import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from 'src/business/dto/create-business.dto';
import { UpdateBusinessDto } from 'src/business/dto/update-business.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { FindBusinessDto } from './dto/find-business.dto';

@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessController {
  private readonly logger = new Logger(BusinessController.name);
  constructor(private readonly businessService: BusinessService) {}

  private getUserId(req: { user: { userId: string } }): string | null {
    if ('userId' in req.user) {
      return req.user.userId;
    } else {
      return null;
    }
  }

  @Get('/')
  async findBusiness(
    @Req() req: { user: { userId: string } },
    @Query() query: FindBusinessDto,
  ) {
    const userId = this.getUserId(req);
    if (!userId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException('User not authorized');
    }

    if (query.search === 'owner') {
      return await this.businessService.findByOwnerId({
        ownerId: userId,
      });
    }
    if (query.search === 'business') {
      return await this.businessService.findOne({
        businessId: query.businessId,
      });
    }
  }

  @Post('/')
  async create(@Body() dto: CreateBusinessDto) {
    return await this.businessService.create(dto);
  }

  @Put('/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return await this.businessService.update(id, dto);
  }
}
