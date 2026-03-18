import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const APP_DIRECTORY = ".speekr";
const DATABASE_FILE = "speekr.db";

export const DATABASE_DIRECTORY_PATH = join(homedir(), APP_DIRECTORY);
export const DATABASE_PATH = join(DATABASE_DIRECTORY_PATH, DATABASE_FILE);

export function createDatabaseClient() {
  mkdirSync(DATABASE_DIRECTORY_PATH, { recursive: true });

  const db = new Database(DATABASE_PATH);
  db.pragma("foreign_keys = ON");

  return db;
}
