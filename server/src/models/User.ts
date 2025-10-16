export interface IUserDB {
  id: number;
  username: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

export interface IUser {
  id: number;
  username: string;
}

export interface IUserResponse {
  id: number;
  username: string;
  name: string;
  phone: string;
  address: string;
}

export interface IUserCreate {
  username: string;
  password: string;
  name: string;
  phone: string;
  address: string;
}

export interface IUserLogin {
  username: string;
  password: string;
}

export interface IAuthResponse {
  id: number;
  username: string;
  accessToken: string;
}
