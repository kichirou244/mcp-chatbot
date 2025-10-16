import { IOrderDetailResponse } from "./OrderDetail";

export interface IOrderCreate {
    userId: number;
    outletId: number;
    date: Date;
    totalAmount: number;
}

export interface IOrder {
    id: number;
    userId: number;
    date: Date;
    totalAmount: number;
    status: string;
}

export interface IOrderResponse {
    orderId: number;
    userId: number;
    totalAmount: number;
    orderDetails: IOrderDetailResponse[];
    date: Date;
    status: string;
}