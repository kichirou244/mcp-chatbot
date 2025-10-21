export interface ICreateOrderRequest {
  accessToken?: string;
  question: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface IOrderDetail {
  id?: number;
  orderId?: number;
  productId: number;
  productName?: string;
  productDescription?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  outletId?: number;
}

export interface IOrder {
  orderId: number;
  userId: number;
  date: string;
  totalAmount: number;
  status: string;
  orderDetails: IOrderDetail[];
}

export interface IOrderCreate {
  userId: number;
  status?: string;
  orderDetails: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface IOrderUpdate {
  status?: string;
  orderDetails?: Array<{
    id?: number;
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface ITopProduct {
  productId: number;
  productName: string;
  productDescription: string;
  totalQuantitySold: number;
  totalRevenue: number;
  orderCount: number;
}

export interface ITopUser {
  userId: number;
  userName: string;
  userPhone: string;
  userAddress: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
}