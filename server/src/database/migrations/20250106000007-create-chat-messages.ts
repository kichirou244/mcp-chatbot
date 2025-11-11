import { QueryInterface, DataTypes } from "sequelize";

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("chat_messages", {
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
      role: {
        type: DataTypes.ENUM("user", "assistant", "system"),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tool_used: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      tokens_used: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex("chat_messages", ["session_id"], {
      name: "idx_chat_messages_session_id",
    });
    await queryInterface.addIndex("chat_messages", ["role"], {
      name: "idx_chat_messages_role",
    });
    await queryInterface.addIndex("chat_messages", ["created_at"], {
      name: "idx_chat_messages_created_at",
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("chat_messages");
  },
};
