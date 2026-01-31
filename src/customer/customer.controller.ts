import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-cutomer.dto';
import { FindCustomersQueryDto } from './dto/find-customers-query.dto';
import { ImportCustomersDto } from './dto/import-customers.dto';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(private readonly customerService: CustomerService) {}

  private getUserId(req: { user: { userId: string } }): string | null {
    if ('userId' in req.user) {
      return req.user.userId;
    } else {
      return null;
    }
  }

  @Get('/')
  async getCustomers(
    @Req() req: { user: { userId: string } },
    @Query() query: FindCustomersQueryDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException('User not authorized');
    }

    if (query.filter === 'one') {
      return await this.customerService.findOne({
        customerId: query.customerId,
        ownerId,
        businessId: query.businessId,
      });
    }
    if (query.filter === 'many') {
      query.limit = query.limit ?? 10;
      query.page = query.page ?? 1;
      return await this.customerService.find({
        ownerId,
        businessId: query.businessId,
        limit: query.limit,
        page: query.page,
      });
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('')
  async createCustomer(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateCustomerDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException('User not authorized');
    }
    return await this.customerService.createOne({
      ownerId,
      businessId: dto.businessId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      notes: dto.notes,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('/import')
  async importCustomers(
    @Req() req: { user: { userId: string } },
    @Body() dto: ImportCustomersDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException('User not authorized');
    }
    return await this.customerService.importCustomers({
      ownerId,
      businessId: dto.businessId,
      customers: dto.customers,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Put('/:customerId')
  async updateCustomer(
    @Req() req: { user: { userId: string } },
    @Param('customerId') customerId: string,
    @Body() payload: UpdateCustomerDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException('User not authorized');
    }
    return await this.customerService.updateOne({
      customerId,
      ownerId,
      payload,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:customerId')
  async deleteCustomer(
    @Req() req: { user: { userId: string } },
    @Param('customerId') customerId: string,
    @Query('businessId') businessId: string,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException('User not authorized');
    }
    return await this.customerService.deleteCustomer({
      customerId,
      ownerId,
      businessId,
    });
  }
}
