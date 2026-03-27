import { nanoid } from "nanoid";
import { rmSync } from "node:fs";
import {
  closeDatabaseClient,
  DATABASE_PATH,
  getDatabaseClient,
  RECORDINGS_DIRECTORY_PATH,
} from "../client.ts";
import type {
  AIProvider,
  TranscriptionChoice,
  User,
  UserTrack,
} from "../../types/index.ts";

class SetupService {
  resetDatabase() {
    closeDatabaseClient();
    rmSync(DATABASE_PATH, { force: true });
    rmSync(RECORDINGS_DIRECTORY_PATH, { force: true, recursive: true });
  }

  isSetupComplete(): boolean {
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

  runInitialSetup(input: {
    username: string;
    languageIds: string[];
    defaultModel: AIProvider | null;
    transcriptionChoice: Exclude<TranscriptionChoice, null>;
    openAIKey?: string | null;
    anthropicKey?: string | null;
    deepgramKey?: string | null;
  }): { user: User; tracks: UserTrack[] } {
    const { username, languageIds, defaultModel } = input;
    const { transcriptionChoice } = input;
    const db = getDatabaseClient();

    const userId = getPrimaryUserId(db) ?? nanoid();

    const user: User = {
      id: userId,
      name: username,
    };

    const uniqueLanguageIds = Array.from(new Set(languageIds));
    const tracks: UserTrack[] = uniqueLanguageIds.map((languageId) => ({
      id: nanoid(),
      userId,
      language: languageId,
      proficiency: 1,
    }));

    const writeSetup = db.transaction(() => {
      db.prepare(
        "INSERT INTO users (id, name) VALUES (@id, @name) ON CONFLICT(id) DO UPDATE SET name = excluded.name"
      ).run(user);
      db.prepare("DELETE FROM user_tracks WHERE user_id = ?").run(userId);
      const insertTrack = db.prepare(
        "INSERT INTO user_tracks (id, user_id, language_id, proficiency) VALUES (@id, @userId, @languageId, @proficiency)"
      );
      for (const track of tracks) {
        insertTrack.run({
          id: track.id,
          userId,
          languageId: track.language,
          proficiency: 1,
        });
      }

      const existingConfig = ensureConfigurationRow(db);

      const nextOpenAIKey =
        input.openAIKey !== undefined ? input.openAIKey : existingConfig.openAIKey;
      const nextAnthropicKey =
        input.anthropicKey !== undefined
          ? input.anthropicKey
          : existingConfig.anthropicKey;
      const nextDeepgramKey =
        input.deepgramKey !== undefined
          ? input.deepgramKey
          : existingConfig.deepgramKey;
      const nextDefaultModel = defaultModel ?? existingConfig.defaultModel;

      db.prepare(
        "UPDATE configuration SET openAIKey = ?, anthropicKey = ?, deepgramKey = ?, defaultModel = ?, transcriptionChoice = ? WHERE rowid = ?"
      ).run(
        nextOpenAIKey,
        nextAnthropicKey,
        nextDeepgramKey,
        nextDefaultModel,
        transcriptionChoice,
        existingConfig.rowid
      );
      db.prepare("DELETE FROM configuration WHERE rowid != ?").run(
        existingConfig.rowid
      );
    });

    writeSetup();

    return { user, tracks };
  }
}

type ConfigRow = {
  rowid: number;
  openAIKey: string | null;
  anthropicKey: string | null;
  deepgramKey: string | null;
  defaultModel: AIProvider | null;
  transcriptionChoice: TranscriptionChoice;
};

function readConfigurationRow(
  db: ReturnType<typeof getDatabaseClient>
): ConfigRow | null {
  const row = db
    .prepare(
      "SELECT rowid, openAIKey, anthropicKey, deepgramKey, defaultModel, transcriptionChoice FROM configuration ORDER BY rowid ASC LIMIT 1"
    )
    .get() as ConfigRow | undefined;
  return row ?? null;
}

function ensureConfigurationRow(db: ReturnType<typeof getDatabaseClient>): ConfigRow {
  const existing = readConfigurationRow(db);
  if (existing) {
    return existing;
  }

  db.prepare(
    "INSERT INTO configuration (openAIKey, anthropicKey, defaultModel, transcriptionChoice) VALUES (NULL, NULL, NULL, NULL)"
  ).run();

  const inserted = readConfigurationRow(db);
  if (!inserted) {
    throw new Error("Failed to initialize configuration row.");
  }
  return inserted;
}

function getPrimaryUserId(db: ReturnType<typeof getDatabaseClient>) {
  const row = db.prepare("SELECT id FROM users LIMIT 1").get() as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}

export const setup = new SetupService();

