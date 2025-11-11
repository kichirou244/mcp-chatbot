import { Sequelize, QueryTypes } from "sequelize";
import config from "./config/config";
import * as path from "path";
import * as fs from "fs";
import { pathToFileURL } from "url";

const env = (process.env.NODE_ENV || "development") as keyof typeof config;
const dbConfig = config[env];

if (!dbConfig) {
  throw new Error(`No database configuration found for environment: ${env}`);
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging ? console.log : false,
  }
);

interface MigrationRecord {
  name: string;
}

async function createMigrationsTable(): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS SequelizeMeta (
      name VARCHAR(255) NOT NULL PRIMARY KEY
    )
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const results = await sequelize.query<MigrationRecord>(
    "SELECT name FROM SequelizeMeta ORDER BY name ASC",
    { type: QueryTypes.SELECT }
  );
  return results.map((r: MigrationRecord) => r.name);
}

async function addMigrationRecord(name: string): Promise<void> {
  await sequelize.query("INSERT INTO SequelizeMeta (name) VALUES (?)", {
    replacements: [name],
  });
}

async function removeMigrationRecord(name: string): Promise<void> {
  await sequelize.query("DELETE FROM SequelizeMeta WHERE name = ?", {
    replacements: [name],
  });
}

async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = path.join(__dirname, "migrations");

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir);
  return files.filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts")).sort();
}

async function runMigrations(): Promise<void> {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connection established");

    await createMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    const migrationFiles = await getMigrationFiles();

    const pendingMigrations = migrationFiles.filter(
      (f) => !executedMigrations.includes(f)
    );

    if (pendingMigrations.length === 0) {
      console.log("✓ No pending migrations");
      return;
    }

    console.log(
      `\n📋 Found ${pendingMigrations.length} pending migration(s):\n`
    );
    pendingMigrations.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log("");

    for (const file of pendingMigrations) {
      console.log(`⏳ Running migration: ${file}`);
      const migrationPath = path.join(__dirname, "migrations", file);
      const migrationUrl = pathToFileURL(migrationPath).href;
      const migration = await import(migrationUrl);

      if (!migration.default || typeof migration.default.up !== "function") {
        throw new Error(
          `Invalid migration file: ${file}. Missing 'up' method.`
        );
      }

      await migration.default.up(sequelize.getQueryInterface());
      await addMigrationRecord(file);
      console.log(`✓ Completed: ${file}\n`);
    }

    console.log("✅ All migrations completed successfully\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function undoLastMigration(): Promise<void> {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connection established");

    await createMigrationsTable();

    const executedMigrations = await getExecutedMigrations();

    if (executedMigrations.length === 0) {
      console.log("✓ No migrations to undo");
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    console.log(`\n⏳ Undoing migration: ${lastMigration}`);

    const migrationPath = path.join(__dirname, "migrations", lastMigration);
    const migrationUrl = pathToFileURL(migrationPath).href;
    const migration = await import(migrationUrl);

    if (!migration.default || typeof migration.default.down !== "function") {
      throw new Error(
        `Invalid migration file: ${lastMigration}. Missing 'down' method.`
      );
    }

    await migration.default.down(sequelize.getQueryInterface());
    await removeMigrationRecord(lastMigration);
    console.log(`✓ Reverted: ${lastMigration}\n`);
  } catch (error) {
    console.error("\n❌ Migration undo failed:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function undoAllMigrations(): Promise<void> {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connection established");

    await createMigrationsTable();

    const executedMigrations = await getExecutedMigrations();

    if (executedMigrations.length === 0) {
      console.log("✓ No migrations to undo");
      return;
    }

    console.log(`\n📋 Undoing ${executedMigrations.length} migration(s):\n`);

    for (let i = executedMigrations.length - 1; i >= 0; i--) {
      const migrationName = executedMigrations[i];
      console.log(`⏳ Undoing migration: ${migrationName}`);

      const migrationPath = path.join(__dirname, "migrations", migrationName);
      const migrationUrl = pathToFileURL(migrationPath).href;
      const migration = await import(migrationUrl);

      if (!migration.default || typeof migration.default.down !== "function") {
        throw new Error(
          `Invalid migration file: ${migrationName}. Missing 'down' method.`
        );
      }

      await migration.default.down(sequelize.getQueryInterface());
      await removeMigrationRecord(migrationName);
      console.log(`✓ Reverted: ${migrationName}\n`);
    }

    console.log("✅ All migrations reverted successfully\n");
  } catch (error) {
    console.error("\n❌ Migration undo failed:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function showMigrationStatus(): Promise<void> {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connection established\n");

    await createMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    const migrationFiles = await getMigrationFiles();

    console.log("Migration Status:");
    console.log("=".repeat(70));

    if (migrationFiles.length === 0) {
      console.log("No migration files found");
    } else {
      for (const file of migrationFiles) {
        const isExecuted = executedMigrations.includes(file);
        const status = isExecuted ? "✓ up  " : "✗ down";
        const statusColor = isExecuted ? "\x1b[32m" : "\x1b[33m"; // green or yellow
        const resetColor = "\x1b[0m";
        console.log(`${statusColor}${status}${resetColor}  ${file}`);
      }
    }

    console.log("=".repeat(70));

    const pending = migrationFiles.length - executedMigrations.length;
    console.log(
      `Total: ${migrationFiles.length} | Executed: ${executedMigrations.length} | Pending: ${pending}\n`
    );
  } catch (error) {
    console.error("\n❌ Failed to get migration status:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  try {
    if (args.includes("--undo-all")) {
      await undoAllMigrations();
    } else if (args.includes("--undo")) {
      await undoLastMigration();
    } else if (args.includes("--status")) {
      await showMigrationStatus();
    } else {
      await runMigrations();
    }
  } catch (error) {
    process.exit(1);
  }
}

main();
