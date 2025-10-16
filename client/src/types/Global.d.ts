export interface IToolResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface IResponse<T> {
  ok: boolean;
  data: T;
}
