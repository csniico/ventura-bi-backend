import { Customer } from '../entities/customer.entity';

export interface IVerifyOwnershipParams {
  businessId: string;
  ownerId?: string;
}

export interface IFindOneCustomerParams {
  customerId: string;
  ownerId: string;
  businessId: string;
}

export interface IFindCustomersParams {
  ownerId: string;
  businessId: string;
  limit: number;
  page: number;
}

export interface IFindCustomersResults {
  customers: Customer[];
  total: number;
}

export interface ICreateCustomerParams {
  ownerId: string;
  businessId: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface IUpdateCustomerParams {
  customerId: string;
  ownerId: string;
  payload: Partial<Customer>;
}

export interface IDeleteCustomerParams {
  customerId: string;
  ownerId: string;
  businessId: string;
}

export interface IImportCustomerItem {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface IImportCustomersParams {
  ownerId: string;
  businessId: string;
  customers: IImportCustomerItem[];
}

export interface IImportCustomersResult {
  imported: number;
  failed: number;
  customers: Customer[];
}
