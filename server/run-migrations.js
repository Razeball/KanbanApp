import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const config = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    },
  },
};

console.log("Database config:", {
  host: config.host,
  username: config.username,
  database: config.database,
  port: config.port,
  hasPassword: !!config.password,
});

const sequelize = new Sequelize(config);

async function runMigrations() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    console.log("Running migrations...");

    const migrationsPath = path.join(__dirname, "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".js"))
      .sort();

    console.log(
      `Found ${migrationFiles.length} migration files:`,
      migrationFiles
    );

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = await import(path.join(migrationsPath, file));

      try {
        let upFunction;
        if (migration.default && migration.default.up) {
          upFunction = migration.default.up;
        } else if (migration.up) {
          upFunction = migration.up;
        } else {
          throw new Error(`No up function found in migration ${file}`);
        }

        await upFunction(sequelize.getQueryInterface(), Sequelize);
        console.log(`✓ Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`✗ Migration ${file} failed:`, error.message);
        if (error.message.includes("already exists")) {
          console.log(`  Skipping ${file} - table already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log("All migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
