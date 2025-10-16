export interface IProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  outletId: number;
}

export interface IProductCreate {
  name: string;
  description: string;
  price: number;
  quantity: number;
  outletId: number;
}
