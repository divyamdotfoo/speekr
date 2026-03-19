import { nanoid } from "nanoid";
import { rmSync } from "node:fs";
import {
  closeDatabaseClient,
  DATABASE_PATH,
  getDatabaseClient,
  RECORDINGS_DIRECTORY_PATH,
} from "./client.ts";
import type {
  Configuration,
  ProficiencyLevel,
  User,
  UserSession,
  UserTrack,
} from "../types/index.ts";

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
  language: string;
  proficiency: ProficiencyLevel;
}): UserTrack {
  const { userId, language, proficiency } = input;
  const db = getDatabaseClient();

  const track: UserTrack = {
    id: nanoid(),
    userId,
    language,
    proficiency,
  };

  db.prepare(
    "INSERT INTO user_tracks (id, user_id, language, proficiency) VALUES (@id, @userId, @language, @proficiency)"
  ).run(track);

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
    "INSERT INTO configuration (openAIKey, anthropicKey) VALUES (@openAIKey, @anthropicKey)"
  ).run(config);
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
      "SELECT id, user_id as userId, language, proficiency FROM user_tracks WHERE user_id = ? LIMIT 1"
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
  language: string;
  proficiency: ProficiencyLevel;
}): { user: User; track: UserTrack } {
  const { username, language, proficiency } = input;
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
    language,
    proficiency,
  };

  const writeSetup = db.transaction(() => {
    db.prepare(
      "INSERT INTO users (id, name) VALUES (@id, @name) ON CONFLICT(id) DO UPDATE SET name = excluded.name"
    ).run(user);
    db.prepare("DELETE FROM user_tracks WHERE user_id = ?").run(userId);
    db.prepare(
      "INSERT INTO user_tracks (id, user_id, language, proficiency) VALUES (@id, @userId, @language, @proficiency)"
    ).run(track);
  });

  writeSetup();

  return { user, track };
}
