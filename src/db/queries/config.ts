import { getDatabaseClient } from "../client.ts";
import type {
  AIProvider,
  Configuration,
  TranscriptionChoice,
} from "../../types/index.ts";

class ConfigService {
  saveConfiguration(config: Configuration) {
    const db = getDatabaseClient();

    db.exec("DELETE FROM configuration");
    db.prepare(
      "INSERT INTO configuration (openAIKey, anthropicKey, defaultModel, transcriptionChoice) VALUES (@openAIKey, @anthropicKey, @defaultModel, @transcriptionChoice)"
    ).run(config);
  }

  getConfiguration(): Configuration {
    const db = getDatabaseClient();
    return toConfiguration(readConfigurationRow(db));
  }

  getTranscriptionChoice(): TranscriptionChoice {
    const db = getDatabaseClient();
    const row = db
      .prepare("SELECT transcriptionChoice FROM configuration LIMIT 1")
      .get() as { transcriptionChoice: TranscriptionChoice } | undefined;
    return row?.transcriptionChoice ?? null;
  }

  getOpenAIKey(): string | null {
    const db = getDatabaseClient();
    const row = db
      .prepare("SELECT openAIKey FROM configuration LIMIT 1")
      .get() as { openAIKey: string | null } | undefined;
    return row?.openAIKey ?? null;
  }

  setTranscriptionChoice(choice: Exclude<TranscriptionChoice, null>) {
    const db = getDatabaseClient();
    const existingRow = ensureConfigurationRow(db);

    db.prepare(
      "UPDATE configuration SET openAIKey = ?, anthropicKey = ?, defaultModel = ?, transcriptionChoice = ? WHERE rowid = ?"
    ).run(
      existingRow.openAIKey,
      existingRow.anthropicKey,
      existingRow.defaultModel,
      choice,
      existingRow.rowid
    );
    db.prepare("DELETE FROM configuration WHERE rowid != ?").run(
      existingRow.rowid
    );
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

function toConfiguration(row: ConfigRow | null): Configuration {
  return {
    openAIKey: row?.openAIKey ?? null,
    anthropicKey: row?.anthropicKey ?? null,
    deepgramKey: row?.deepgramKey ?? null,
    defaultModel: row?.defaultModel ?? null,
    transcriptionChoice: row?.transcriptionChoice ?? null,
  };
}

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

export const config = new ConfigService();

