import type Database from "better-sqlite3";

export function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_tracks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      language TEXT NOT NULL,
      proficiency TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_track_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_track_id) REFERENCES user_tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS configuration (
      openAIKey TEXT,
      anthropicKey TEXT
    );
  `);
}
