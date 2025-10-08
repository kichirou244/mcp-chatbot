export interface ICreateOrderRequest {
  accessToken?: string;
  question: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface IOrder {
  id: string;
  
}