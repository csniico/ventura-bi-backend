import { CreateOrderItemDto } from '../dto/create-order.dto';
import { ItemType } from '../entities/order-item.entity';

export interface ICreateOrderItem {
  businessId: string;
  ownerId: string;
  itemType: ItemType;
  name: string;
  price: number;
  quantity: number;
  productId?: string;
  serviceId?: string;
}

export interface ICreateOrder {
  businessId: string;
  ownerId: string;
  customerId?: string;
  items: CreateOrderItemDto[];
}

export interface IOrderItemResourceValidationParams {
  businessId: string;
  ownerId: string;
  itemType: ItemType;
  resourceId: string;
  resourceName: string;
}

export interface IResourceValidationError {
  resourceName: string;
  message: string;
  resourceType: ItemType;
}

export interface IUpdateOrderStatusParams {
  orderId: string;
  businessId: string;
  ownerId: string;
  status: string;
}

export interface IGetOrdersParams {
  businessId: string;
  ownerId: string;
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface IGetOrderByIdParams {
  orderId: string;
  businessId: string;
  ownerId: string;
}

export interface IGetCustomerOrdersParams {
  customerId: string;
  businessId: string;
  ownerId: string;
  page?: number;
  limit?: number;
}

export interface ISearchOrdersParams {
  businessId: string;
  ownerId: string;
  searchQuery: string;
  searchFilters?: {
    startDate?: string;
    endDate?: string;
    minTotal?: number;
    maxTotal?: number;
  };
  page?: number;
  limit?: number;
}

export interface IGetOrderStatsParams {
  businessId: string;
  ownerId: string;
  startDate?: string;
  endDate?: string;
}

export interface ILinkOrdersToInvoiceParams {
  orderIds: string[];
  invoiceId: string;
  businessId: string;
  ownerId: string;
}
