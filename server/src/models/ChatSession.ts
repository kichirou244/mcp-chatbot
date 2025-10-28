import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from "sequelize-typescript";
import { User } from "./User";
import { Order } from "./Order";

export interface IChatSession {
  id: number;
  userId: number | null;
  sessionId: string;
  startDate: Date;
  endDate: Date | null;
  totalTokens: number;
  status: "ACTIVE" | "ENDED";
}

export interface IChatMessage {
  id: number;
  sessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  toolUsed: string | null;
  tokensUsed: number;
  createdAt: Date;
}

export interface ISessionOrder {
  id: number;
  sessionId: number;
  orderId: number;
  createdAt: Date;
}

@Table({
  tableName: "chat_sessions",
  timestamps: false,
})
export class ChatSession extends Model<
  IChatSession,
  Omit<IChatSession, "id">
> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: "user_id",
  })
  declare userId: number | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    field: "session_id",
  })
  declare sessionId: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: "start_date",
  })
  declare startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "end_date",
  })
  declare endDate: Date | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: "total_tokens",
  })
  declare totalTokens: number;

  @Column({
    type: DataType.ENUM("ACTIVE", "ENDED"),
    allowNull: false,
    defaultValue: "ACTIVE",
  })
  declare status: "ACTIVE" | "ENDED";

  user?: User;
}

@Table({
  tableName: "chat_messages",
  timestamps: false,
})
export class ChatMessage extends Model<IChatMessage, Omit<IChatMessage, "id">> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "session_id",
  })
  declare sessionId: number;

  @Column({
    type: DataType.ENUM("user", "assistant", "system"),
    allowNull: false,
  })
  declare role: "user" | "assistant" | "system";

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare content: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: "tool_used",
  })
  declare toolUsed: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: "tokens_used",
  })
  declare tokensUsed: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: "created_at",
  })
  declare createdAt: Date;
}

@Table({
  tableName: "session_orders",
  timestamps: false,
})
export class SessionOrder extends Model<ISessionOrder, Omit<ISessionOrder, "id">> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => ChatSession)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "session_id",
  })
  declare sessionId: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "order_id",
  })
  declare orderId: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: "created_at",
  })
  declare createdAt: Date;

  // Associations defined in associations.ts
  order?: any;
  session?: ChatSession;
}
