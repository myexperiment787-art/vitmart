import { Pool } from "pg";
import type { QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;
const useDatabase = Boolean(connectionString);

export function isDatabaseConfigured() {
  return useDatabase;
}

const globalForDb = globalThis as unknown as { pool?: Pool; initPromise?: Promise<void> };

export const pool =
  globalForDb.pool ||
  new Pool(
    connectionString
      ? {
          connectionString,
          ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
        }
      : {}
  );

if (!globalForDb.pool) {
  globalForDb.pool = pool;
}

let initialized = false;

export async function initDatabase() {
  if (!useDatabase) return;
  if (initialized) return;
  if (globalForDb.initPromise) {
    await globalForDb.initPromise;
    return;
  }

  globalForDb.initPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        reset_token_hash TEXT,
        reset_token_expires_at BIGINT
      );

      CREATE TABLE IF NOT EXISTS app_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT,
        items TEXT NOT NULL,
        item_amount NUMERIC NOT NULL,
        total NUMERIC NOT NULL,
        payment_id TEXT,
        timestamp BIGINT NOT NULL,
        restaurant_name TEXT NOT NULL,
        restaurant_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        driver TEXT
      );
    `);

    await pool.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS disabled_at BIGINT`);
    await pool.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS disabled_reason TEXT`);
    await pool.query(`
      DO $$
      DECLARE
        constraint_record RECORD;
      BEGIN
        FOR constraint_record IN
          SELECT conname
          FROM pg_constraint
          WHERE conrelid = 'app_users'::regclass
            AND contype = 'u'
            AND array_length(conkey, 1) = 1
            AND conkey[1] = (
              SELECT attnum
              FROM pg_attribute
              WHERE attrelid = 'app_users'::regclass
                AND attname = 'phone'
            )
        LOOP
          EXECUTE format('ALTER TABLE app_users DROP CONSTRAINT %I', constraint_record.conname);
        END LOOP;
      END $$;
    `);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS app_users_phone_role_key ON app_users (phone, role)`);

    initialized = true;
  })();

  await globalForDb.initPromise;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  if (!useDatabase) {
    throw new Error("Database mode is disabled. Set DATABASE_URL to use Postgres-backed storage.");
  }
  await initDatabase();
  return pool.query<T>(text, values);
}
