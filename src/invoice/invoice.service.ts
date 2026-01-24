import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus, InvoiceType } from './entities/invoice.entity';
import { BusinessService } from 'src/business/business.service';
import { CustomerService } from 'src/customer/customer.service';
import { OrderService } from 'src/order/order.service';
import { IVerifyOwnershipParams } from 'src/customer/interfaces/customer.interfaces';
import {
  ICreateInvoice,
  IGetCustomerInvoicesParams,
  IGetInvoiceByIdParams,
  IGetInvoicesParams,
  IOrderValidationError,
  IUpdateInvoicePaymentParams,
  IUpdateInvoiceStatusParams,
} from './interfaces/invoice.interfaces';
import { IInvoiceAnalyticsParams } from './interfaces/invoice-analytics.interfaces';

interface IFinancialSummaryRaw {
  totalRevenue: string;
  totalTax: string;
  vatAmount: string;
  nhilAmount: string;
  getfundAmount: string;
  netRevenue: string;
}

interface IUnpaidInvoicesRaw {
  totalUnpaid: string;
  count: string;
}
import { OrderStatus } from 'src/order/entities/order.entity';

const VAT_RATE = 0.15; // 15%
const NHIL_RATE = 0.025; // 2.5%
const GETFUND_RATE = 0.025; // 2.5%

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @Inject('INVOICE_REPOSITORY')
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly businessService: BusinessService,
    private readonly customerService: CustomerService,
    private readonly orderService: OrderService,
  ) {}

  private async verifyBusinessOwnership(params: IVerifyOwnershipParams) {
    const { businessId, ownerId } = params;

    if (!ownerId) {
      this.logger.warn(`Owner ID is missing in ownership verification`);
      throw new UnauthorizedException('Unauthorized attempt to access invoice');
    }

    const business = await this.businessService.findOne({ businessId });
    if (!business || !(business.ownerId === ownerId)) {
      this.logger.warn(`Ownership verification failed for owner`);
      throw new UnauthorizedException('Unauthorized attempt to access invoice');
    }
  }

  async createInvoice(params: ICreateInvoice) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const { orderIds } = params;

    if (!orderIds || orderIds.length === 0) {
      this.logger.warn('Invoice creation attempted with no orders');
      throw new BadRequestException('At least one order is required');
    }

    // Fetch all orders and validate them
    const orders = await Promise.all(
      orderIds.map(async (orderId) => {
        try {
          return await this.orderService.getOrderById({
            orderId,
            businessId: params.businessId,
            ownerId: params.ownerId,
          });
        } catch (error) {
          this.logger.warn(
            `Order fetch failed for orderId: ${orderId}:`,
            error,
          );
          return null;
        }
      }),
    );

    // Validate orders
    const validationErrors: IOrderValidationError[] = [];

    orders.forEach((order, index) => {
      const orderId = orderIds[index];

      // Check if order exists
      if (!order) {
        validationErrors.push({
          orderId,
          message: 'Order does not exist or you do not have access to it',
        });
        return;
      }

      // Check if order belongs to the specified customer
      if (order.customerId !== params.customerId) {
        validationErrors.push({
          orderId,
          orderNumber: order.orderNumber,
          message: `Order belongs to a different customer`,
        });
      }

      // Check if order is already invoiced
      if (order.invoiceId) {
        validationErrors.push({
          orderId,
          orderNumber: order.orderNumber,
          message: 'Order is already invoiced',
        });
      }

      // Check if order is completed if invoice is not PROFORMA
      if (
        params.invoiceType !== InvoiceType.PROFORMA &&
        order.status !== OrderStatus.COMPLETED
      ) {
        validationErrors.push({
          orderId,
          orderNumber: order.orderNumber,
          message: `Order status is ${order.status}, must be COMPLETED to invoice`,
        });
      }
    });

    if (validationErrors.length > 0) {
      this.logger.warn(
        'Invoice creation failed due to order validation errors',
      );
      throw new BadRequestException({
        message: 'One or more orders are invalid for invoicing',
        errors: validationErrors,
      });
    }

    // Calculate invoice totals
    const validOrders = orders.filter((order) => order !== null);
    const subtotal = validOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const vatAmount = subtotal * VAT_RATE;
    const nhilAmount = subtotal * NHIL_RATE;
    const getfundAmount = subtotal * GETFUND_RATE;
    const totalTax = vatAmount + nhilAmount + getfundAmount;
    const totalAmount = subtotal + totalTax;

    // Create invoice
    const newInvoice = this.invoiceRepository.create({
      businessId: params.businessId,
      customerId: params.customerId,
      subtotal,
      vatRate: VAT_RATE,
      vatAmount,
      nhilRate: NHIL_RATE,
      nhilAmount,
      getfundRate: GETFUND_RATE,
      getfundAmount,
      totalTax,
      totalAmount,
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(),
      dueDate: new Date(params.dueDate),
      notes: params.notes,
      invoiceType: params.invoiceType,
    });

    const invoice = await this.invoiceRepository.save(newInvoice);

    // Link orders to this invoice
    await this.orderService.linkOrdersToInvoice({
      orderIds: validOrders.map((order) => order.id),
      invoiceId: invoice.id,
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    // Fetch the complete invoice with relations
    const completeInvoice = await this.invoiceRepository.findOne({
      where: { id: invoice.id },
      relations: [
        'orders',
        'orders.items',
        'orders.items.product',
        'orders.items.service',
        'customer',
        'business',
      ],
    });

    return completeInvoice;
  }

  async getInvoices(params: IGetInvoicesParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.orders', 'orders')
      .leftJoinAndSelect('orders.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.service', 'service')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .where('invoice.businessId = :businessId', {
        businessId: params.businessId,
      });

    if (params.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: params.status,
      });
    }

    if (params.customerId) {
      queryBuilder.andWhere('invoice.customerId = :customerId', {
        customerId: params.customerId,
      });
    }

    const [invoices, total] = await queryBuilder
      .orderBy('invoice.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoiceById(params: IGetInvoiceByIdParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const invoice = await this.invoiceRepository.findOne({
      where: { id: params.invoiceId, businessId: params.businessId },
      relations: [
        'orders',
        'orders.items',
        'orders.items.product',
        'orders.items.service',
        'customer',
        'business',
      ],
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found: ${params.invoiceId}`);
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getCustomerInvoices(params: IGetCustomerInvoicesParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const [invoices, total] = await this.invoiceRepository.findAndCount({
      where: {
        customerId: params.customerId,
        businessId: params.businessId,
      },
      relations: [
        'orders',
        'orders.items',
        'orders.items.product',
        'orders.items.service',
      ],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateInvoicePayment(params: IUpdateInvoicePaymentParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const invoice = await this.invoiceRepository.findOne({
      where: { id: params.invoiceId, businessId: params.businessId },
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found for payment update`);
      throw new NotFoundException(
        `Invoice with ID ${params.invoiceId} not found`,
      );
    }

    // Validate payment amount
    const totalAmountPaid =
      Number(invoice.amountPaid) + Number(params.amountPaid);
    if (totalAmountPaid > Number(invoice.totalAmount)) {
      this.logger.warn(
        `Payment amount exceeds invoice total. Invoice: ${invoice.totalAmount}, Attempted: ${totalAmountPaid}`,
      );
      throw new BadRequestException(
        `Payment amount (${totalAmountPaid}) exceeds invoice total (${invoice.totalAmount})`,
      );
    }

    // Update payment details
    invoice.amountPaid = totalAmountPaid;
    invoice.paymentMethod = params.paymentMethod;
    invoice.paymentDate = params.paymentDate
      ? new Date(params.paymentDate)
      : new Date();

    // Auto-update status based on payment
    const amountDue = Number(invoice.totalAmount) - totalAmountPaid;
    if (amountDue === 0) {
      invoice.status = InvoiceStatus.PAID;
    } else if (totalAmountPaid > 0 && amountDue > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    return await this.invoiceRepository.save(invoice);
  }

  async updateInvoiceStatus(params: IUpdateInvoiceStatusParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const invoice = await this.invoiceRepository.findOne({
      where: { id: params.invoiceId, businessId: params.businessId },
    });

    if (!invoice) {
      this.logger.warn(`Invoice not found for status update`);
      throw new NotFoundException(
        `Invoice with ID ${params.invoiceId} not found`,
      );
    }

    invoice.status = params.status;
    return await this.invoiceRepository.save(invoice);
  }

  /**
   * Get financial summary for analytics
   */
  async getFinancialSummary(params: IInvoiceAnalyticsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.businessId = :businessId', {
        businessId: params.businessId,
      })
      .andWhere('invoice.status != :cancelledStatus', {
        cancelledStatus: InvoiceStatus.CANCELLED,
      })
      .select('SUM(invoice.totalAmount)', 'totalRevenue')
      .addSelect('SUM(invoice.totalTax)', 'totalTax')
      .addSelect('SUM(invoice.vatAmount)', 'vatAmount')
      .addSelect('SUM(invoice.nhilAmount)', 'nhilAmount')
      .addSelect('SUM(invoice.getfundAmount)', 'getfundAmount')
      .addSelect('SUM(invoice.subtotal)', 'netRevenue')
      .getRawOne<IFinancialSummaryRaw>();

    return {
      totalRevenue: Number(result?.totalRevenue) || 0,
      totalTax: Number(result?.totalTax) || 0,
      vatAmount: Number(result?.vatAmount) || 0,
      nhilAmount: Number(result?.nhilAmount) || 0,
      getfundAmount: Number(result?.getfundAmount) || 0,
      netRevenue: Number(result?.netRevenue) || 0,
    };
  }

  /**
   * Get unpaid invoices for analytics
   */
  async getUnpaidInvoices(params: IInvoiceAnalyticsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const result = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.businessId = :businessId', {
        businessId: params.businessId,
      })
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: [
          InvoiceStatus.DRAFT,
          InvoiceStatus.SENT,
          InvoiceStatus.PARTIALLY_PAID,
          InvoiceStatus.OVERDUE,
        ],
      })
      .select('COUNT(invoice.id)', 'count')
      .addSelect('SUM(invoice.totalAmount - invoice.amountPaid)', 'totalUnpaid')
      .getRawOne<IUnpaidInvoicesRaw>();

    return {
      amount: Number(result?.totalUnpaid) || 0,
      count: Number(result?.count) || 0,
    };
  }

  /**
   * Get overdue invoices for alerts
   */
  async getOverdueInvoices(params: IInvoiceAnalyticsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const limit = params.limit ?? 10;
    const now = new Date();

    const overdueInvoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .where('invoice.businessId = :businessId', {
        businessId: params.businessId,
      })
      .andWhere('invoice.dueDate < :now', { now })
      .andWhere('invoice.status != :paidStatus', {
        paidStatus: InvoiceStatus.PAID,
      })
      .andWhere('invoice.status != :cancelledStatus', {
        cancelledStatus: InvoiceStatus.CANCELLED,
      })
      .orderBy('invoice.dueDate', 'ASC')
      .take(limit)
      .getMany();

    return overdueInvoices.map((invoice) => {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(invoice.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customer?.name || 'Unknown',
        amount: Number(invoice.totalAmount) - Number(invoice.amountPaid),
        dueDate: invoice.dueDate,
        daysOverdue,
      };
    });
  }

  /**
   * Get cancelled invoices analytics
   */
  async getCancelledInvoicesAnalytics(params: IInvoiceAnalyticsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const cancelledInvoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.orders', 'order')
      .leftJoinAndSelect('order.items', 'items')
      .where('invoice.businessId = :businessId', {
        businessId: params.businessId,
      })
      .andWhere('invoice.status = :cancelledStatus', {
        cancelledStatus: InvoiceStatus.CANCELLED,
      })
      .getMany();

    const total = cancelledInvoices.length;
    const totalRevenueLost = cancelledInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );

    const mappings = cancelledInvoices.map((invoice) => {
      const firstOrder = invoice.orders?.[0];
      const products =
        firstOrder?.items.map((item) => ({
          productId: item.product?.id || item.service?.id || '',
          productName: item.name,
          quantity: item.quantity,
          price: Number(item.price),
        })) || [];

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customer?.name || 'Unknown',
        orderId: firstOrder?.id || null,
        orderNumber: firstOrder?.orderNumber || null,
        products,
        cancelledAt: invoice.updatedAt,
        reason: invoice.notes || null,
      };
    });

    return { total, totalRevenueLost, mappings };
  }

  /**
   * Get total invoice count
   */
  async getInvoiceCount(params: IInvoiceAnalyticsParams): Promise<number> {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    return await this.invoiceRepository.count({
      where: { businessId: params.businessId },
    });
  }
}
