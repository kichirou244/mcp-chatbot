import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Order } from "./Order";
import { Product } from "./Product";

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
  createdAt?: Date;
  updatedAt?: Date;
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

@Table({
  tableName: "order_details",
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ["order_id"],
    },
    {
      fields: ["product_id"],
    },
  ],
})
export class OrderDetail extends Model<IOrderDetail, IOrderDetailCreate> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "order_id",
  })
  declare orderId: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "product_id",
  })
  declare productId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare quantity: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    field: "unit_price",
  })
  declare unitPrice: number;

  @BelongsTo(() => Order)
  declare order?: Order;

  @BelongsTo(() => Product)
  declare product?: Product;
}
