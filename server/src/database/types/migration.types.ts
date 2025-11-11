import { QueryInterface } from "sequelize";

export interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

export interface ColumnDefinition {
  type: any;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  allowNull?: boolean;
  unique?: boolean;
  defaultValue?: any;
  references?: {
    model: string;
    key: string;
  };
  onUpdate?: string;
  onDelete?: string;
}

export interface TableDefinition {
  [columnName: string]: ColumnDefinition;
}

export interface IndexOptions {
  name?: string;
  unique?: boolean;
  fields?: string[];
}
