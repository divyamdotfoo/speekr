import type Database from "better-sqlite3";
import { nanoid } from "nanoid";
import { SUPPORTED_LANGUAGES } from "../constants/index.ts";
import { TOPICS } from "../constants/topics.ts";

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
      proficiency INTEGER NOT NULL CHECK (proficiency BETWEEN 1 AND 10),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (language_id) REFERENCES supported_languages(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_track_id TEXT NOT NULL,
      topic_id TEXT,
      transcriptText TEXT,
      audioDurationMs INTEGER NOT NULL,
      audioFilePath TEXT NOT NULL,
      wordCount INTEGER,
      confidenceScore INTEGER,
      feedback_status TEXT NOT NULL DEFAULT 'pending' CHECK (feedback_status IN ('pending', 'completed', 'failed')),
      feedback_error TEXT,
      feedback_summary TEXT,
      detected_language TEXT,
      feedback_confidence_score INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_track_id) REFERENCES user_tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      proficiency INTEGER NOT NULL CHECK (proficiency BETWEEN 1 AND 10),
      hints_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sentence_rewrites (
      id TEXT PRIMARY KEY,
      user_session_id TEXT NOT NULL,
      user_track_id TEXT NOT NULL,
      original_sentence TEXT NOT NULL,
      improved_sentence TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_track_id) REFERENCES user_tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id TEXT PRIMARY KEY,
      user_track_id TEXT NOT NULL,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example TEXT NOT NULL,
      usage_count INTEGER NOT NULL DEFAULT 1,
      first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_track_id) REFERENCES user_tracks(id) ON DELETE CASCADE,
      UNIQUE (user_track_id, word)
    );

    CREATE TABLE IF NOT EXISTS grammar_patterns (
      id TEXT PRIMARY KEY,
      user_track_id TEXT NOT NULL,
      pattern_type TEXT NOT NULL,
      explanation TEXT NOT NULL,
      occurrences INTEGER NOT NULL DEFAULT 1,
      first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_track_id) REFERENCES user_tracks(id) ON DELETE CASCADE,
      UNIQUE (user_track_id, pattern_type)
    );

    CREATE INDEX IF NOT EXISTS idx_sentence_rewrites_user_session_id
      ON sentence_rewrites(user_session_id);
    CREATE INDEX IF NOT EXISTS idx_sentence_rewrites_user_track_id
      ON sentence_rewrites(user_track_id);
    CREATE INDEX IF NOT EXISTS idx_vocabulary_user_track_id
      ON vocabulary(user_track_id);
    CREATE INDEX IF NOT EXISTS idx_grammar_patterns_user_track_id
      ON grammar_patterns(user_track_id);
    CREATE INDEX IF NOT EXISTS idx_topics_proficiency
      ON topics(proficiency);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_track_topic
      ON user_sessions(user_track_id, topic_id);

    CREATE TABLE IF NOT EXISTS configuration (
      openAIKey TEXT,
      anthropicKey TEXT,
      deepgramKey TEXT,
      defaultModel TEXT CHECK (defaultModel IN ('openai', 'anthropic') OR defaultModel IS NULL),
      transcriptionChoice TEXT CHECK (transcriptionChoice IN ('local', 'openai', 'deepgram') OR transcriptionChoice IS NULL)
    );
  `);

  const seed = db.transaction(() => {
    const insert = db.prepare(
      "INSERT OR IGNORE INTO supported_languages (id, code, label) VALUES (?, ?, ?)"
    );
    for (const lang of SUPPORTED_LANGUAGES) {
      insert.run(nanoid(), lang.code, lang.label);
    }

    const insertTopic = db.prepare(
      "INSERT OR IGNORE INTO topics (id, title, description, proficiency, hints_json) VALUES (?, ?, ?, ?, ?)"
    );
    for (const topic of TOPICS) {
      insertTopic.run(
        nanoid(),
        topic.title,
        topic.description,
        topic.proficiency,
        JSON.stringify(topic.hints)
      );
    }
  });

  seed();
}
