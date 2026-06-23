import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const DATA_DIR = join(process.cwd(), process.env.QUEUE_DATA_DIR ?? "data");
const DB_FILE = join(DATA_DIR, "queue.db");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  ensureDataDir();

  db = new Database(DB_FILE);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT UNIQUE,
      data TEXT NOT NULL,
      caption TEXT,
      target TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority INTEGER NOT NULL DEFAULT 0,
      retry_count INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 3,
      successful_channels TEXT,
      last_error TEXT,
      scheduled_at INTEGER NOT NULL,
      manual_scheduled_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      processing_started_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status);
    CREATE INDEX IF NOT EXISTS idx_queue_scheduled_at ON queue(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_queue_priority ON queue(priority DESC);

    CREATE TABLE IF NOT EXISTS dead_letter_queue (
      id TEXT PRIMARY KEY,
      original_queue_id TEXT,
      data TEXT NOT NULL,
      caption TEXT,
      target TEXT,
      error TEXT,
      retry_count INTEGER,
      created_at INTEGER NOT NULL,
      moved_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('min_interval_minutes', '5'),
      ('max_interval_minutes', '7');
  `);

  try {
    db.exec("ALTER TABLE queue ADD COLUMN target TEXT");
  } catch {
    // column already exists
  }
  try {
    db.exec("ALTER TABLE dead_letter_queue ADD COLUMN target TEXT");
  } catch {
    // column already exists
  }
  try {
    db.exec("ALTER TABLE queue ADD COLUMN successful_channels TEXT");
  } catch {
    // column already exists
  }

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
