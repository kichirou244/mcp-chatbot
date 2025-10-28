import { Table, Column, Model, DataType } from "sequelize-typescript";
import { Order } from "./Order";
import { ChatSession } from "./ChatSession";

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

@Table({
  tableName: "users",
  timestamps: false,
})
export class User extends Model<IUserDB, IUserCreate> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare username: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare phone: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare address: string;

  orders?: Order[];
  chatSessions?: ChatSession[];
}
