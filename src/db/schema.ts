import type Database from "better-sqlite3";
import { nanoid } from "nanoid";
import { SUPPORTED_LANGUAGES } from "../constants/supported-languages.ts";

export function createSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS supported_languages (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_tracks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      language_id TEXT NOT NULL,
      proficiency TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (language_id) REFERENCES supported_languages(id) ON DELETE RESTRICT
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
      anthropicKey TEXT,
      transcriptionChoice TEXT CHECK (transcriptionChoice IN ('local', 'https') OR transcriptionChoice IS NULL)
    );
  `);

  const seed = db.transaction(() => {
    const insert = db.prepare(
      "INSERT OR IGNORE INTO supported_languages (id, code, label) VALUES (?, ?, ?)"
    );
    for (const lang of SUPPORTED_LANGUAGES) {
      insert.run(nanoid(), lang.code, lang.label);
    }
  });

  seed();
}
