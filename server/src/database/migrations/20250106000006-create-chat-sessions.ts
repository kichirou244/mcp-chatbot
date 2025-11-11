import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("chat_sessions", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      total_tokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "ENDED"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
    });

    await queryInterface.addIndex("chat_sessions", ["session_id"], {
      name: "idx_chat_sessions_session_id",
      unique: true,
    });
    await queryInterface.addIndex("chat_sessions", ["user_id"], {
      name: "idx_chat_sessions_user_id",
    });
    await queryInterface.addIndex("chat_sessions", ["status"], {
      name: "idx_chat_sessions_status",
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("chat_sessions");
  },
};
