import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createSchema } from "./schema.ts";

const APP_DIRECTORY = ".speekr";
const DATABASE_FILE = "speekr.db";

export const DATABASE_DIRECTORY_PATH = join(homedir(), APP_DIRECTORY);
export const DATABASE_PATH = join(DATABASE_DIRECTORY_PATH, DATABASE_FILE);

let databaseClient: Database.Database | null = null;

export function getDatabaseClient() {
  if (databaseClient) {
    return databaseClient;
  }

  mkdirSync(DATABASE_DIRECTORY_PATH, { recursive: true });

  databaseClient = new Database(DATABASE_PATH);
  databaseClient.pragma("foreign_keys = ON");
  createSchema(databaseClient);

  return databaseClient;
}

export function closeDatabaseClient() {
  if (!databaseClient) {
    return;
  }

  databaseClient.close();
  databaseClient = null;
}
