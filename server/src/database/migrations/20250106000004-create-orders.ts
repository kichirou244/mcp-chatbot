import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("orders", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
    });

    await queryInterface.addIndex("orders", ["user_id"], {
      name: "idx_orders_user_id",
    });
    await queryInterface.addIndex("orders", ["status"], {
      name: "idx_orders_status",
    });
    await queryInterface.addIndex("orders", ["date"], {
      name: "idx_orders_date",
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("orders");
  },
};
