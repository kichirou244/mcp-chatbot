export interface IOrderDetailCreate {
    orderId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
}

export interface IOrderDetail {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
}

export interface IOrderDetailResponse {
    id: number;
    orderId: number;
    productId: number;
    productName: string;
    productDescription: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    outletId: number;
}