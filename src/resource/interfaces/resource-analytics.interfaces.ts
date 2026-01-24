export interface ITopSellingProduct {
  id: string;
  name: string;
  primaryImage: string | null;
  totalRevenue: number;
  totalQuantitySold: number;
  totalOrders: number;
}

export interface IOutOfStockProduct {
  id: string;
  name: string;
  lastSoldDate: Date | null;
  demandScore: number;
}

export interface IResourceAnalyticsParams {
  businessId: string;
  ownerId: string;
  limit?: number;
}
