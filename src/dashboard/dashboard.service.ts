import { Injectable, Logger } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { InvoiceService } from 'src/invoice/invoice.service';
import { CustomerService } from 'src/customer/customer.service';
import { ResourceService } from 'src/resource/resource.service';
import {
  IDashboardSummaryParams,
  IDashboardSummaryResponse,
  IRecentActivity,
} from './interfaces/dashboard.interfaces';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly invoiceService: InvoiceService,
    private readonly customerService: CustomerService,
    private readonly resourceService: ResourceService,
  ) {}

  async getDashboardSummary(
    params: IDashboardSummaryParams,
  ): Promise<IDashboardSummaryResponse> {
    const { businessId, ownerId } = params;

    // Fetch all analytics data in parallel
    const [
      financialData,
      unpaidInvoices,
      orderAnalytics,
      totalCustomers,
      totalProducts,
      totalInvoices,
      pendingOrders,
      outOfStockProducts,
      overdueInvoices,
      topSellingProducts,
      topCustomers,
      cancelledOrdersAnalytics,
      cancelledInvoicesAnalytics,
    ] = await Promise.all([
      this.invoiceService.getFinancialSummary({ businessId, ownerId }),
      this.invoiceService.getUnpaidInvoices({ businessId, ownerId }),
      this.orderService.getOrderAnalytics({ businessId, ownerId }),
      this.customerService.getCustomerCount({ businessId, ownerId }),
      this.resourceService.getProductCount({ businessId, ownerId }),
      this.invoiceService.getInvoiceCount({ businessId, ownerId }),
      this.orderService.getPendingOrders({ businessId, ownerId, limit: 10 }),
      this.resourceService.getOutOfStockProducts({
        businessId,
        ownerId,
        limit: 10,
      }),
      this.invoiceService.getOverdueInvoices({
        businessId,
        ownerId,
        limit: 10,
      }),
      this.resourceService.getTopSellingProducts({
        businessId,
        ownerId,
        limit: 10,
      }),
      this.customerService.getTopCustomers({ businessId, ownerId, limit: 10 }),
      this.orderService.getCancelledOrdersAnalytics({ businessId, ownerId }),
      this.invoiceService.getCancelledInvoicesAnalytics({
        businessId,
        ownerId,
      }),
    ]);

    // Calculate trend (placeholder - you'd compare with previous period)
    const trend = {
      percentage: 12.5,
      direction: 'up' as const,
    };

    // Build recent activity timeline
    const recentActivity = this.buildRecentActivity({
      pendingOrders,
      overdueInvoices,
      outOfStockProducts,
      cancelledOrders: cancelledOrdersAnalytics.details.slice(0, 5),
    });

    return {
      financial: {
        totalRevenue: {
          amount: financialData.totalRevenue,
          trend,
        },
        netRevenue: {
          amount: financialData.netRevenue,
          afterTaxes: true,
        },
        totalTax: {
          amount: financialData.totalTax,
          breakdown: {
            vat: {
              rate: 0.15,
              amount: financialData.vatAmount,
            },
            nhil: {
              rate: 0.025,
              amount: financialData.nhilAmount,
            },
            getfund: {
              rate: 0.025,
              amount: financialData.getfundAmount,
            },
          },
        },
        unpaidInvoices,
      },
      stats: {
        totalOrders: orderAnalytics.total,
        totalCustomers,
        totalProducts,
        totalInvoices,
      },
      alerts: {
        pendingOrders: {
          count: orderAnalytics.pending,
          items: pendingOrders,
        },
        outOfStockProducts: {
          count: outOfStockProducts.length,
          items: outOfStockProducts,
        },
        overdueInvoices: {
          count: overdueInvoices.length,
          items: overdueInvoices,
        },
      },
      topPerformers: {
        topSellingProducts,
        topCustomers,
      },
      recentActivity,
      cancellations: {
        cancelledOrders: {
          total: cancelledOrdersAnalytics.total,
          totalRevenueLost: cancelledOrdersAnalytics.totalRevenueLost,
          byReason: cancelledOrdersAnalytics.byReason,
        },
        cancelledInvoices: {
          total: cancelledInvoicesAnalytics.total,
          totalRevenueLost: cancelledInvoicesAnalytics.totalRevenueLost,
          mappings: cancelledInvoicesAnalytics.mappings,
        },
      },
    };
  }

  private buildRecentActivity(data: {
    pendingOrders: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      amount: number;
      createdAt: Date;
    }>;
    overdueInvoices: Array<{
      id: string;
      invoiceNumber: string;
      customerName: string;
      amount: number;
      dueDate: Date;
      daysOverdue: number;
    }>;
    outOfStockProducts: Array<{
      id: string;
      name: string;
      lastSoldDate: Date | null;
      demandScore: number;
    }>;
    cancelledOrders: Array<{
      orderId: string;
      orderNumber: string;
      customerName: string | null;
      totalAmount: number;
      cancelledAt: Date;
      reason: string | null;
    }>;
  }): IRecentActivity[] {
    const activities: IRecentActivity[] = [];

    // Add pending orders
    data.pendingOrders.slice(0, 2).forEach((order) => {
      activities.push({
        id: `activity-order-${order.id}`,
        type: 'new_order',
        title: 'New order',
        description: `Order ${order.orderNumber} was created`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          amount: order.amount,
        },
        timestamp: order.createdAt,
      });
    });

    // Add overdue invoices
    data.overdueInvoices.slice(0, 2).forEach((invoice) => {
      activities.push({
        id: `activity-invoice-${invoice.id}`,
        type: 'invoice_overdue',
        title: 'Invoice overdue',
        description: `Invoice ${invoice.invoiceNumber} is ${invoice.daysOverdue} days overdue`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amount: invoice.amount,
          daysOverdue: invoice.daysOverdue,
        },
        timestamp: invoice.dueDate,
      });
    });

    // Add out of stock products
    data.outOfStockProducts.slice(0, 2).forEach((product) => {
      activities.push({
        id: `activity-product-${product.id}`,
        type: 'product_out_of_stock',
        title: 'Product out of stock',
        description: `${product.name} is now out of stock`,
        metadata: {
          productId: product.id,
          productName: product.name,
        },
        timestamp: product.lastSoldDate || new Date(),
      });
    });

    // Add cancelled orders
    data.cancelledOrders.forEach((order) => {
      activities.push({
        id: `activity-cancel-${order.orderId}`,
        type: 'order_cancelled',
        title: 'Order cancelled',
        description: `Order ${order.orderNumber} was cancelled`,
        metadata: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          amount: order.totalAmount,
          reason: order.reason,
        },
        timestamp: order.cancelledAt,
      });
    });

    // Sort by timestamp descending
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);
  }
}
