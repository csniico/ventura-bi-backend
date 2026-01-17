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
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { GetInvoicesQueryDto } from './dto/get-invoices-query.dto';
import { GetCustomerInvoicesQueryDto } from './dto/get-customer-invoices-query.dto';
import { UpdateInvoicePaymentDto } from './dto/update-invoice-payment.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoiceType } from './entities/invoice.entity';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);
  constructor(private readonly invoiceService: InvoiceService) {}

  private getUserId(req: { user: { userId: string } }): string | null {
    if ('userId' in req.user) {
      return req.user.userId;
    } else {
      return null;
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createInvoice(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateInvoiceDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.invoiceService.createInvoice({
      businessId: dto.businessId,
      customerId: dto.customerId,
      orderIds: dto.orderIds,
      dueDate: dto.dueDate,
      notes: dto.notes,
      invoiceType: dto.invoiceType ?? InvoiceType.STANDARD,
      ownerId,
    });
  }

  @Get('customer/:customerId')
  async getCustomerInvoices(
    @Req() req: { user: { userId: string } },
    @Param('customerId') customerId: string,
    @Query() query: GetCustomerInvoicesQueryDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.invoiceService.getCustomerInvoices({
      customerId,
      businessId: query.businessId,
      ownerId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get()
  async getInvoices(
    @Req() req: { user: { userId: string } },
    @Query() query: GetInvoicesQueryDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.invoiceService.getInvoices({
      businessId: query.businessId,
      ownerId,
      status: query.status,
      customerId: query.customerId,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async getInvoiceById(
    @Req() req: { user: { userId: string } },
    @Param('id') invoiceId: string,
    @Query('businessId') businessId: string,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.invoiceService.getInvoiceById({
      invoiceId,
      businessId,
      ownerId,
    });
  }

  @Patch(':id/payment')
  async updateInvoicePayment(
    @Req() req: { user: { userId: string } },
    @Param('id') invoiceId: string,
    @Query('businessId') businessId: string,
    @Body() dto: UpdateInvoicePaymentDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.invoiceService.updateInvoicePayment({
      invoiceId,
      businessId,
      ownerId,
      amountPaid: dto.amountPaid,
      paymentMethod: dto.paymentMethod,
      paymentDate: dto.paymentDate,
    });
  }

  @Patch(':id/status')
  async updateInvoiceStatus(
    @Req() req: { user: { userId: string } },
    @Param('id') invoiceId: string,
    @Query('businessId') businessId: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    const ownerId = this.getUserId(req);
    if (!ownerId) {
      this.logger.warn('User ID not found in request');
      throw new UnauthorizedException(
        'You must be logged in to perform this action',
      );
    }
    return await this.invoiceService.updateInvoiceStatus({
      invoiceId,
      businessId,
      ownerId,
      status: dto.status,
    });
  }
}
