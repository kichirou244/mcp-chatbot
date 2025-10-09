export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

export interface IAuthResponse {
  id: number;
  username: string;
  accessToken: string;
}
