import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { GetCustomerOrdersQueryDto } from './dto/get-customer-orders-query.dto';
import { SearchOrdersQueryDto } from './dto/search-orders-query.dto';
import { GetOrderStatsQueryDto } from './dto/get-order-stats-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);
  constructor(private readonly orderService: OrderService) {}

  private getUserId(req: { user: { userId: string } }): string | null {
    if ('userId' in req.user) {
      return req.user.userId;
    } else {
      return null;
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createOrder(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateOrderDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.orderService.createOrder({
      businessId: dto.businessId,
      customerId: dto.customerId,
      items: dto.items,
      ownerId,
    });
  }

  @Get('search')
  async searchOrders(
    @Req() req: { user: { userId: string } },
    @Query() query: SearchOrdersQueryDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }

    const searchFilters =
      query.filters === 'on'
        ? {
            startDate: query.startDate,
            endDate: query.endDate,
            minTotal: query.minTotal,
            maxTotal: query.maxTotal,
          }
        : undefined;

    return await this.orderService.searchOrders({
      businessId: query.businessId,
      ownerId,
      searchQuery: query.q,
      searchFilters,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('stats')
  async getOrderStats(
    @Req() req: { user: { userId: string } },
    @Query() query: GetOrderStatsQueryDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.orderService.getOrderStats({
      businessId: query.businessId,
      ownerId,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Get('customer/:customerId')
  async getCustomerOrders(
    @Req() req: { user: { userId: string } },
    @Param('customerId') customerId: string,
    @Query() query: GetCustomerOrdersQueryDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.orderService.getCustomerOrders({
      customerId,
      businessId: query.businessId,
      ownerId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get()
  async getOrders(
    @Req() req: { user: { userId: string } },
    @Query() query: GetOrdersQueryDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.orderService.getOrders({
      businessId: query.businessId,
      ownerId,
      status: query.status,
      customerId: query.customerId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async getOrderById(
    @Req() req: { user: { userId: string } },
    @Param('id') orderId: string,
    @Query('businessId') businessId: string,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.orderService.getOrderById({
      orderId,
      businessId,
      ownerId,
    });
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Req() req: { user: { userId: string } },
    @Param('id') orderId: string,
    @Query('businessId') businessId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.orderService.updateOrderStatus({
      orderId,
      businessId,
      ownerId,
      status: dto.status,
    });
  }
}
