import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { Outlet } from "./Outlet";
import { OrderDetail } from "./OrderDetail";

export interface IProduct {
  id: number;
  outletId: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductWithOutlet extends IProduct {
  outletName: string;
  outletAddress: string;
}

@Table({
  tableName: "products",
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ["outlet_id"],
    },
    {
      fields: ["name"],
    },
  ],
})
export class Product extends Model<IProduct, Omit<IProduct, "id">> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Outlet)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "outlet_id",
  })
  declare outletId: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare price: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare quantity: number;

  @BelongsTo(() => Outlet)
  declare outlet?: Outlet;

  @HasMany(() => OrderDetail)
  declare orderDetails?: OrderDetail[];
}
