import { Product } from '../entities/product.entity';
import { Service } from '../entities/service.entity';

export interface ICreateProductParams {
  ownerId: string;
  businessId: string;
  name: string;
  primaryImage?: string;
  supportingImages?: string[];
  availableQuantity?: number;
  description?: string;
  notes?: string;
  price?: number;
}

export interface ICreateServiceParams {
  ownerId: string;
  businessId: string;
  name: string;
  primaryImage?: string;
  supportingImages?: string[];
  description?: string;
  notes?: string;
  price?: number;
  businessHours?: Record<string, any>;
}

export interface IUpdateProductParams {
  ownerId: string;
  businessId: string;
  productId: string;
  name?: string;
  primaryImage?: string;
  supportingImages?: string[];
  availableQuantity?: number;
  description?: string;
  notes?: string;
  price?: number;
}

export interface IUpdateProductInventoryParams {
  ownerId: string;
  businessId: string;
  productId: string;
  quantityChange: number; // positive or negative
}

export interface IUpdateServiceParams {
  ownerId: string;
  businessId: string;
  serviceId: string;
  name?: string;
  primaryImage?: string;
  supportingImages?: string[];
  description?: string;
  notes?: string;
  price?: number;
  businessHours?: Record<string, any>;
}

export interface IFindResourceParams {
  ownerId: string;
  businessId: string;
  resourceId: string;
  search: 'product' | 'service';
  filter: 'one' | 'many';
  limit?: number;
  page?: number;
}

export interface IFindOneProductParams {
  ownerId: string;
  businessId: string;
  productId: string;
}

export interface IFindOneServiceParams {
  ownerId: string;
  businessId: string;
  serviceId: string;
}

export interface IDeleteProductParams {
  ownerId: string;
  businessId: string;
  productId: string;
}

export interface IDeleteServiceParams {
  ownerId: string;
  businessId: string;
  serviceId: string;
}

export interface IDeleteResourceParams {
  ownerId: string;
  businessId: string;
  resourceId: string;
}

export interface ISearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minAvailableQuantity?: number;
}

export interface ISearchProductsAndServicesParams {
  ownerId: string;
  businessId: string;
  searchQuery: string;
  searchFilters?: ISearchFilters;
  limit?: number;
  page?: number;
}

export interface IGetProductsByIdsParams {
  ownerId: string;
  businessId: string;
  productIds: string[];
}

export interface IGetServicesByIdsParams {
  ownerId: string;
  businessId: string;
  serviceIds: string[];
}

export interface ISearchProductsAndServicesResult {
  products: Product[];
  services: Service[];
}
