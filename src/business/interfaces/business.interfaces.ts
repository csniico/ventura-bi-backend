export interface IFindBusinessParams {
  ownerId?: string;
  businessId?: string;
  limit?: number;
  page?: number;
}
export interface IFindBusinessResults {
  businesses: any[];
  total: number;
}
export interface IFindBusinessByOwnerParams {
  ownerId: string;
}
export interface IFindBusinessByIdParams {
  businessId: string;
}
