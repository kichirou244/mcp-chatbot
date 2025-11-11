import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { User } from "./User";
import { OrderDetail } from "./OrderDetail";

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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderResponse {
  orderId: number;
  userId: number;
  totalAmount: number;
  orderDetails: any[];
  date: Date;
  status: string;
}

@Table({
  tableName: "orders",
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ["user_id"],
    },
    {
      fields: ["status"],
    },
    {
      fields: ["date"],
    },
  ],
})
export class Order extends Model<IOrder, IOrderCreate> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "user_id",
  })
  declare userId: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare date: Date;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    field: "total_amount",
  })
  declare totalAmount: number;

  @Column({
    type: DataType.ENUM("PENDING", "COMPLETED", "CANCELLED"),
    allowNull: false,
    defaultValue: "PENDING",
  })
  declare status: string;

  @BelongsTo(() => User)
  declare user?: User;

  @HasMany(() => OrderDetail)
  declare orderDetails?: OrderDetail[];
}
