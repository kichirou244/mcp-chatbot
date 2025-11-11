import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("session_orders", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "chat_sessions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex("session_orders", ["session_id"], {
      name: "idx_session_orders_session_id",
    });
    await queryInterface.addIndex("session_orders", ["order_id"], {
      name: "idx_session_orders_order_id",
    });

    await queryInterface.addIndex(
      "session_orders",
      ["session_id", "order_id"],
      {
        name: "idx_session_orders_session_order",
        unique: true,
      }
    );
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("session_orders");
  },
};
