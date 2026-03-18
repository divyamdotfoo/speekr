import { nanoid } from "nanoid";
import { rmSync } from "node:fs";
import { DATABASE_PATH } from "./client.ts";
import { createDatabaseClient } from "./client.ts";
import { createSchema } from "./schema.ts";
import type {
  Configuration,
  User,
  UserSession,
  UserTrack,
} from "../types/index.ts";

export function setupDatabase() {
  const db = createDatabaseClient();
  createSchema(db);
  db.close();
}

export function resetDatabase() {
  rmSync(DATABASE_PATH, { force: true });
}

export function createUser(name: string): User {
  const db = createDatabaseClient();
  createSchema(db);

  const user: User = {
    id: nanoid(),
    name,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(
    "INSERT INTO users (id, name, updated_at) VALUES (@id, @name, @updatedAt)",
  ).run(user);
  db.close();

  return user;
}

export function createUserTrack(input: {
  userId: string;
  language: string;
  proficiency: string;
}): UserTrack {
  const { userId, language, proficiency } = input;
  const db = createDatabaseClient();
  createSchema(db);

  const track: UserTrack = {
    id: nanoid(),
    userId,
    language,
    proficiency,
  };

  db.prepare(
    "INSERT INTO user_tracks (id, user_id, language, proficiency) VALUES (@id, @userId, @language, @proficiency)",
  ).run(track);
  db.close();

  return track;
}

export function createUserSession(input: {
  userId: string;
  userTrackId: string;
}): UserSession {
  const { userId, userTrackId } = input;
  const db = createDatabaseClient();
  createSchema(db);

  const session: UserSession = {
    id: nanoid(),
    userId,
    userTrackId,
  };

  db.prepare(
    "INSERT INTO user_sessions (id, user_id, user_track_id) VALUES (@id, @userId, @userTrackId)",
  ).run(session);
  db.close();

  return session;
}

export function saveConfiguration(config: Configuration) {
  const db = createDatabaseClient();
  createSchema(db);

  db.exec("DELETE FROM configuration");
  db.prepare(
    "INSERT INTO configuration (openAIKey, anthropicKey) VALUES (@openAIKey, @anthropicKey)",
  ).run(config);
  db.close();
}
