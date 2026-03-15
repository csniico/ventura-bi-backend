import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ORDER_ITEM_REPOSITORY, ORDERS_REPOSITORY } from 'src/constants';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { ItemType, OrderItem } from './entities/order-item.entity';
import {
  ICreateOrder,
  ICreateOrderItem,
  IGetCustomerOrdersParams,
  IGetOrderByIdParams,
  IGetOrdersParams,
  IGetOrderStatsParams,
  ILinkOrdersToInvoiceParams,
  IOrderItemResourceValidationParams,
  IResourceValidationError,
  ISearchOrdersParams,
  IUpdateOrderStatusParams,
} from './interfaces/order.interfaces';
import { IOrderAnalyticsParams } from './interfaces/order-analytics.interfaces';
import { BusinessService } from 'src/business/business.service';
import { CustomerService } from 'src/customer/customer.service';
import { IVerifyOwnershipParams } from 'src/customer/interfaces/customer.interfaces';
import { ResourceService } from 'src/resource/resource.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderCreatedEvent,
  OrderStatusChangedEvent,
  OrderCancelledEvent,
  OrderCompletedEvent,
} from 'src/audit/events/order-events';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject(ORDERS_REPOSITORY) private orderRepository: Repository<Order>,
    @Inject(ORDER_ITEM_REPOSITORY)
    private orderItemRepository: Repository<OrderItem>,
    private readonly businessService: BusinessService,
    private readonly customerService: CustomerService,
    private readonly resourceService: ResourceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async verifyBusinessOwnership(params: IVerifyOwnershipParams) {
    const { businessId, ownerId } = params;

    if (!ownerId) {
      this.logger.warn(`Owner ID is missing in ownership verification`);
      throw new UnauthorizedException(
        'Unauthorized attempt to access resource',
      );
    }

    const business = await this.businessService.findOne({ businessId });
    if (!business || !(business.ownerId === ownerId)) {
      this.logger.warn(`Ownership verification failed for owner`);
      throw new UnauthorizedException(
        'Unauthorized attempt to access resource',
      );
    }
  }

  private async validateOrderItemResources(
    params: IOrderItemResourceValidationParams,
  ) {
    const validationErrors: IResourceValidationError[] = [];

    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    if (params.itemType === ItemType.PRODUCT) {
      const product = await this.resourceService.findOneProduct({
        ownerId: params.ownerId,
        businessId: params.businessId,
        productId: params.resourceId,
      });
      if (!product) {
        validationErrors.push({
          resourceName: `Product with ID ${params.resourceName}`,
          message: 'does not exist.',
          resourceType: ItemType.PRODUCT,
        });
      }
    } else if (params.itemType === ItemType.SERVICE) {
      const service = await this.resourceService.findOneService({
        ownerId: params.ownerId,
        businessId: params.businessId,
        serviceId: params.resourceId,
      });
      if (!service) {
        validationErrors.push({
          resourceName: `Service with ID ${params.resourceName}`,
          message: 'does not exist.',
          resourceType: ItemType.SERVICE,
        });
      }
    } else {
      validationErrors.push({
        resourceName: `Resource with ID ${params.resourceName}`,
        message: 'has an invalid item type.',
        resourceType: params.itemType,
      });
    }

    return validationErrors;
  }

  private async createOrderItem(params: ICreateOrderItem) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const orderItem = this.orderItemRepository.create({
      itemType: params.itemType,
      name: params.name,
      price: params.price,
      quantity: params.quantity,
    });
    const subtotal = params.price * params.quantity;
    orderItem.subTotal = subtotal;

    // Fetch and associate Product based on itemType
    if (params.itemType === ItemType.PRODUCT && params.productId) {
      const product = await this.resourceService.findOneProduct({
        ownerId: params.ownerId,
        businessId: params.businessId,
        productId: params.productId,
      });
      if (!product) {
        throw new NotFoundException(
          `Product with name ${params.name} does not exist.`,
        );
      }

      orderItem.product = product;
    }

    // Fetch and associate Service based on itemType
    if (params.itemType === ItemType.SERVICE && params.serviceId) {
      const service = await this.resourceService.findOneService({
        ownerId: params.ownerId,
        businessId: params.businessId,
        serviceId: params.serviceId,
      });
      if (!service) {
        throw new NotFoundException(
          `Service with name ${params.name} does not exist.`,
        );
      }

      orderItem.service = service;
    }

    return this.orderItemRepository.save(orderItem);
  }

  async createOrder(params: ICreateOrder) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });
    const { items } = params;

    const validationErrors: IResourceValidationError[] = await Promise.all(
      items.map(async (item) => {
        return this.validateOrderItemResources({
          businessId: params.businessId,
          ownerId: params.ownerId,
          itemType: item.itemType,
          resourceId:
            item.itemType === ItemType.PRODUCT
              ? item.productId!
              : item.serviceId!,
          resourceName: item.name,
        });
      }),
    ).then((results) => results.flat());

    if (validationErrors.length > 0) {
      this.logger.warn(
        `Order creation failed due to resource validation errors`,
      );
      throw new NotFoundException({
        message: 'One or more resources are invalid.',
        errors: validationErrors,
      });
    }

    const orderItems: OrderItem[] = await Promise.all(
      items.map(async (item) => {
        return this.createOrderItem({
          businessId: params.businessId,
          ownerId: params.ownerId,
          itemType: item.itemType,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          productId:
            item.itemType === ItemType.PRODUCT ? item.productId : undefined,
          serviceId:
            item.itemType === ItemType.SERVICE ? item.serviceId : undefined,
        });
      }),
    );

    // Update inventory for product items
    await Promise.all(
      items.map(async (item) => {
        if (item.itemType === ItemType.PRODUCT && item.productId) {
          await this.resourceService.updateProductInventory({
            businessId: params.businessId,
            ownerId: params.ownerId,
            productId: item.productId,
            quantityChange: -item.quantity, // Negative to decrease inventory
          });
        }
      }),
    );

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.subTotal,
      0,
    );

    let customerName: string | undefined;
    let customerEmail: string | undefined;
    let customerPhone: string | undefined;

    if (params.customerId) {
      const customer = await this.customerService.findOne({
        customerId: params.customerId,
        ownerId: params.ownerId,
        businessId: params.businessId,
      });
      if (customer) {
        customerName = customer.name;
        customerEmail = customer.email;
        customerPhone = customer.phone;
      }
    }

    const newOrder = this.orderRepository.create({
      businessId: params.businessId,
      customerId: params.customerId,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount: totalAmount,
      items: orderItems,
      status: OrderStatus.PENDING,
    });
    const order = await this.orderRepository.save(newOrder);

    this.eventEmitter.emit('order.created', {
      orderId: order.id,
      customerId: order.customerId,
      totalAmount: Number(order.totalAmount),
      createdBy: params.ownerId,
      timestamp: new Date(),
    } as OrderCreatedEvent);

    return order;
  }

  async updateOrderStatus(params: IUpdateOrderStatusParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const order = await this.orderRepository.findOne({
      where: { id: params.orderId, businessId: params.businessId },
    });
    if (!order) {
      this.logger.warn(`Order not found for status update`);
      throw new NotFoundException(`Order with ID ${params.orderId} not found.`);
    }

    const oldStatus = order.status;
    order.status = params.status as OrderStatus;
    const saved = await this.orderRepository.save(order);

    this.eventEmitter.emit('order.status.changed', {
      orderId: order.id,
      customerId: order.customerId,
      oldStatus,
      newStatus: order.status,
      changedBy: params.ownerId,
      timestamp: new Date(),
    } as OrderStatusChangedEvent);

    if (order.status === OrderStatus.CANCELLED) {
      this.eventEmitter.emit('order.cancelled', {
        orderId: order.id,
        customerId: order.customerId,
        cancelledBy: params.ownerId,
        timestamp: new Date(),
      } as OrderCancelledEvent);
    } else if (order.status === OrderStatus.COMPLETED) {
      this.eventEmitter.emit('order.completed', {
        orderId: order.id,
        customerId: order.customerId,
        totalAmount: Number(order.totalAmount),
        completedBy: params.ownerId,
        timestamp: new Date(),
      } as OrderCompletedEvent);
    }

    return saved;
  }

  async getOrders(params: IGetOrdersParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.service', 'service')
      .where('order.businessId = :businessId', {
        businessId: params.businessId,
      });

    if (params.status) {
      queryBuilder.andWhere('order.status = :status', {
        status: params.status,
      });
    }

    if (params.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', {
        customerId: params.customerId,
      });
    }

    const [orders, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(params: IGetOrderByIdParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const order = await this.orderRepository.findOne({
      where: { id: params.orderId, businessId: params.businessId },
      relations: ['items', 'items.product', 'items.service'],
    });

    if (!order) {
      this.logger.warn(`Order not found: ${params.orderId}`);
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getCustomerOrders(params: IGetCustomerOrdersParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: {
        customerId: params.customerId,
        businessId: params.businessId,
      },
      relations: ['items', 'items.product', 'items.service'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchOrders(params: ISearchOrdersParams) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.service', 'service')
      .where('order.businessId = :businessId', {
        businessId: params.businessId,
      });

    // Search by order number or customer name
    queryBuilder.andWhere(
      '(order.orderNumber ILIKE :searchQuery OR order.customerName ILIKE :searchQuery)',
      {
        searchQuery: `%${params.searchQuery}%`,
      },
    );

    // Apply filters if provided
    if (params.searchFilters) {
      if (params.searchFilters.startDate) {
        queryBuilder.andWhere('order.createdAt >= :startDate', {
          startDate: params.searchFilters.startDate,
        });
      }

      if (params.searchFilters.endDate) {
        const endDate = new Date(params.searchFilters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        queryBuilder.andWhere('order.createdAt < :endDate', {
          endDate: endDate.toISOString(),
        });
      }

      if (params.searchFilters.minTotal !== undefined) {
        queryBuilder.andWhere('order.totalAmount >= :minTotal', {
          minTotal: params.searchFilters.minTotal,
        });
      }

      if (params.searchFilters.maxTotal !== undefined) {
        queryBuilder.andWhere('order.totalAmount <= :maxTotal', {
          maxTotal: params.searchFilters.maxTotal,
        });
      }
    }

    queryBuilder.orderBy('order.createdAt', 'DESC');

    const [orders, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderStats(params: IGetOrderStatsParams) {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.businessId = :businessId', {
        businessId: params.businessId,
      });

    if (params.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setDate(endDate.getDate() + 1);
      queryBuilder.andWhere('order.createdAt < :endDate', {
        endDate: endDate.toISOString(),
      });
    }

    const [totalRevenue, orderCountByStatus, avgOrderValue, topItems] =
      await Promise.all([
        // Total revenue
        queryBuilder
          .select('SUM(order.totalAmount)', 'total')
          .getRawOne()
          .then((result: { total: string } | undefined) =>
            parseFloat(result?.total || '0'),
          ),

        // Order count by status
        this.orderRepository
          .createQueryBuilder('order')
          .select('order.status', 'status')
          .addSelect('COUNT(*)', 'count')
          .where('order.businessId = :businessId', {
            businessId: params.businessId,
          })
          .andWhere(
            params.startDate ? 'order.createdAt >= :startDate' : '1=1',
            params.startDate ? { startDate: params.startDate } : {},
          )
          .andWhere(
            params.endDate ? 'order.createdAt < :endDate' : '1=1',
            params.endDate
              ? {
                  endDate: new Date(
                    new Date(params.endDate).setDate(
                      new Date(params.endDate).getDate() + 1,
                    ),
                  ).toISOString(),
                }
              : {},
          )
          .groupBy('order.status')
          .getRawMany()
          .then((results: Array<{ status: string; count: string }>) => {
            const statusCounts = {
              PENDING: 0,
              COMPLETED: 0,
              CANCELLED: 0,
            };
            results.forEach((row) => {
              if (row.status in statusCounts) {
                statusCounts[row.status as keyof typeof statusCounts] =
                  parseInt(row.count, 10);
              }
            });
            return statusCounts;
          }),

        // Average order value
        queryBuilder
          .select('AVG(order.totalAmount)', 'avg')
          .getRawOne()
          .then((result: { avg: string } | undefined) =>
            parseFloat(result?.avg || '0'),
          ),

        // Top products and services
        this.orderItemRepository
          .createQueryBuilder('item')
          .leftJoin('item.order', 'order')
          .select('item.name', 'name')
          .addSelect('item.itemType', 'type')
          .addSelect('COUNT(*)', 'count')
          .addSelect('SUM(item.subTotal)', 'revenue')
          .where('order.businessId = :businessId', {
            businessId: params.businessId,
          })
          .andWhere(
            params.startDate ? 'order.createdAt >= :startDate' : '1=1',
            params.startDate ? { startDate: params.startDate } : {},
          )
          .andWhere(
            params.endDate ? 'order.createdAt < :endDate' : '1=1',
            params.endDate
              ? {
                  endDate: new Date(
                    new Date(params.endDate).setDate(
                      new Date(params.endDate).getDate() + 1,
                    ),
                  ).toISOString(),
                }
              : {},
          )
          .groupBy('item.name')
          .addGroupBy('item.itemType')
          .orderBy('revenue', 'DESC')
          .limit(10)
          .getRawMany()
          .then(
            (
              results: Array<{
                name: string;
                type: string;
                count: string;
                revenue: string;
              }>,
            ) =>
              results.map((row) => ({
                name: row.name,
                type: row.type,
                orderCount: parseInt(row.count, 10),
                revenue: parseFloat(row.revenue || '0'),
              })),
          ),
      ]);

    return {
      totalRevenue,
      orderCountByStatus,
      avgOrderValue,
      topItems,
    };
  }

  async linkOrdersToInvoice(params: ILinkOrdersToInvoiceParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const { orderIds, invoiceId } = params;

    // Update all orders with the invoiceId
    await Promise.all(
      orderIds.map(async (orderId) => {
        const order = await this.orderRepository.findOne({
          where: { id: orderId, businessId: params.businessId },
        });

        if (!order) {
          this.logger.warn(`Order ${orderId} not found for invoice linking`);
          throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        order.invoiceId = invoiceId;
        return await this.orderRepository.save(order);
      }),
    );

    return { success: true, linkedOrders: orderIds.length };
  }

  /**
   * Get order statistics for analytics dashboard
   */
  async getOrderAnalytics(params: IOrderAnalyticsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const [total, pending, completed, cancelled] = await Promise.all([
      this.orderRepository.count({ where: { businessId: params.businessId } }),
      this.orderRepository.count({
        where: { businessId: params.businessId, status: OrderStatus.PENDING },
      }),
      this.orderRepository.count({
        where: { businessId: params.businessId, status: OrderStatus.COMPLETED },
      }),
      this.orderRepository.count({
        where: { businessId: params.businessId, status: OrderStatus.CANCELLED },
      }),
    ]);

    return { total, pending, completed, cancelled };
  }

  /**
   * Get pending orders for alerts
   */
  async getPendingOrders(params: IOrderAnalyticsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const limit = params.limit ?? 10;

    const orders = await this.orderRepository.find({
      where: { businessId: params.businessId, status: OrderStatus.PENDING },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName || 'Guest',
      amount: Number(order.totalAmount),
      createdAt: order.createdAt,
    }));
  }

  /**
   * Get cancelled orders analytics
   */
  async getCancelledOrdersAnalytics(params: IOrderAnalyticsParams) {
    await this.verifyBusinessOwnership({
      businessId: params.businessId,
      ownerId: params.ownerId,
    });

    const cancelledOrders = await this.orderRepository.find({
      where: { businessId: params.businessId, status: OrderStatus.CANCELLED },
      relations: ['invoice', 'items'],
    });

    const total = cancelledOrders.length;
    const totalRevenueLost = cancelledOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    // Group by reason (using a placeholder since Order entity doesn't have a reason field)
    const reasonMap = new Map<string, { count: number; amount: number }>();
    cancelledOrders.forEach((order) => {
      const reason = 'customer_request'; // Default reason
      const existing = reasonMap.get(reason) || { count: 0, amount: 0 };
      reasonMap.set(reason, {
        count: existing.count + 1,
        amount: existing.amount + Number(order.totalAmount),
      });
    });

    const byReason = Array.from(reasonMap.entries()).map(([reason, data]) => ({
      reason,
      count: data.count,
      amount: data.amount,
    }));

    const details = cancelledOrders.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName || null,
      invoiceId: order.invoiceId,
      invoiceNumber: order.invoice?.invoiceNumber || null,
      products: order.items.map((item) => ({
        productId: item.product?.id || item.service?.id || '',
        productName: item.name,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      totalAmount: Number(order.totalAmount),
      cancelledAt: order.updatedAt,
      reason: null,
    }));

    return { total, totalRevenueLost, byReason, details };
  }
}
