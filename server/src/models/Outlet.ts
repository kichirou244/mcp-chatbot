import { Table, Column, Model, DataType } from "sequelize-typescript";
import { Product } from "./Product";


export interface IOutlet {
    id: number;
    name: string;
    address: string;
}


@Table({
    tableName: "outlets",
    timestamps: false,
})
export class Outlet extends Model<IOutlet, Omit<IOutlet, "id">> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    declare address: string;

    products?: Product[];
}