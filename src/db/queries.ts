import { nanoid } from "nanoid";
import { rmSync } from "node:fs";
import { SUPPORTED_LANGUAGES } from "../constants/supported-languages.ts";
import {
  closeDatabaseClient,
  DATABASE_PATH,
  getDatabaseClient,
  RECORDINGS_DIRECTORY_PATH,
} from "./client.ts";
import type {
  Configuration,
  ProficiencyLevel,
  SupportedLanguage,
  TranscriptionChoice,
  User,
  UserSession,
  UserTrack,
} from "../types/index.ts";

export function listSupportedLanguages(): SupportedLanguage[] {
  const db = getDatabaseClient();
  const rows = db
    .prepare("SELECT id, code, label FROM supported_languages")
    .all() as SupportedLanguage[];

  const rankByCode = new Map(
    SUPPORTED_LANGUAGES.map((language, index) => [language.code, index]),
  );

  return rows.sort((a, b) => {
    const rankA = rankByCode.get(a.code) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rankByCode.get(b.code) ?? Number.MAX_SAFE_INTEGER;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.label.localeCompare(b.label);
  });
}

export function resetDatabase() {
  closeDatabaseClient();
  rmSync(DATABASE_PATH, { force: true });
  rmSync(RECORDINGS_DIRECTORY_PATH, { force: true, recursive: true });
}

export function createUser(name: string): User {
  const db = getDatabaseClient();

  const user: User = {
    id: nanoid(),
    name,
  };

  db.prepare("INSERT INTO users (id, name) VALUES (@id, @name)").run(user);

  return user;
}

export function createUserTrack(input: {
  userId: string;
  languageId: string;
  proficiency: ProficiencyLevel;
}): UserTrack {
  const { userId, languageId, proficiency } = input;
  const db = getDatabaseClient();

  const track: UserTrack = {
    id: nanoid(),
    userId,
    language: languageId,
    proficiency,
  };

  db.prepare(
    "INSERT INTO user_tracks (id, user_id, language_id, proficiency) VALUES (@id, @userId, @languageId, @proficiency)"
  ).run({
    id: track.id,
    userId,
    languageId,
    proficiency,
  });

  return track;
}

export function createUserSession(input: {
  userId: string;
  userTrackId: string;
}): UserSession {
  const { userId, userTrackId } = input;
  const db = getDatabaseClient();

  const session: UserSession = {
    id: nanoid(),
    userId,
    userTrackId,
  };

  db.prepare(
    "INSERT INTO user_sessions (id, user_id, user_track_id) VALUES (@id, @userId, @userTrackId)"
  ).run(session);

  return session;
}

export function saveConfiguration(config: Configuration) {
  const db = getDatabaseClient();

  db.exec("DELETE FROM configuration");
  db.prepare(
    "INSERT INTO configuration (openAIKey, anthropicKey, transcriptionChoice) VALUES (@openAIKey, @anthropicKey, @transcriptionChoice)"
  ).run(config);
}

export function getTranscriptionChoice(): TranscriptionChoice {
  const db = getDatabaseClient();
  const row = db
    .prepare("SELECT transcriptionChoice FROM configuration LIMIT 1")
    .get() as { transcriptionChoice: TranscriptionChoice } | undefined;
  return row?.transcriptionChoice ?? null;
}

export function setTranscriptionChoice(choice: Exclude<TranscriptionChoice, null>) {
  const db = getDatabaseClient();
  const existingRow = db
    .prepare(
      "SELECT rowid, openAIKey, anthropicKey FROM configuration ORDER BY rowid ASC LIMIT 1",
    )
    .get() as
    | { rowid: number; openAIKey: string | null; anthropicKey: string | null }
    | undefined;

  if (!existingRow) {
    db.prepare(
      "INSERT INTO configuration (openAIKey, anthropicKey, transcriptionChoice) VALUES (NULL, NULL, ?)",
    ).run(choice);
    return;
  }

  db.prepare(
    "UPDATE configuration SET openAIKey = ?, anthropicKey = ?, transcriptionChoice = ? WHERE rowid = ?",
  ).run(existingRow.openAIKey, existingRow.anthropicKey, choice, existingRow.rowid);
  db.prepare("DELETE FROM configuration WHERE rowid != ?").run(existingRow.rowid);
}

export function getPrimaryUser(): User | null {
  const db = getDatabaseClient();

  const user = db.prepare("SELECT * FROM users").get() as User | undefined;
  return user ?? null;
}

export function getPrimaryUserTrack(userId: string): UserTrack | null {
  const db = getDatabaseClient();

  const track = db
    .prepare(
      `SELECT
        t.id,
        t.user_id as userId,
        l.code as language,
        t.proficiency
      FROM user_tracks t
      JOIN supported_languages l ON l.id = t.language_id
      WHERE t.user_id = ?
      LIMIT 1`
    )
    .get(userId) as UserTrack | undefined;
  return track ?? null;
}

export function isSetupComplete(): boolean {
  const db = getDatabaseClient();

  const row = db
    .prepare(
      `SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN user_tracks t ON t.user_id = u.id
        LIMIT 1
      ) as isComplete`
    )
    .get() as { isComplete: 0 | 1 };
  return row.isComplete === 1;
}

export function runInitialSetup(input: {
  username: string;
  languageId: string;
  proficiency: ProficiencyLevel;
}): { user: User; track: UserTrack } {
  const { username, languageId, proficiency } = input;
  const db = getDatabaseClient();

  const primaryUser =
    (db.prepare("SELECT id FROM users LIMIT 1").get() as { id: string } | undefined) ??
    null;
  const userId = primaryUser?.id ?? nanoid();

  const user: User = {
    id: userId,
    name: username,
  };

  const track: UserTrack = {
    id: nanoid(),
    userId,
    language: languageId,
    proficiency,
  };

  const writeSetup = db.transaction(() => {
    db.prepare(
      "INSERT INTO users (id, name) VALUES (@id, @name) ON CONFLICT(id) DO UPDATE SET name = excluded.name"
    ).run(user);
    db.prepare("DELETE FROM user_tracks WHERE user_id = ?").run(userId);
    db.prepare(
      "INSERT INTO user_tracks (id, user_id, language_id, proficiency) VALUES (@id, @userId, @languageId, @proficiency)"
    ).run({
      id: track.id,
      userId,
      languageId,
      proficiency,
    });
  });

  writeSetup();

  return { user, track };
}
