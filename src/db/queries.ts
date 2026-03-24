import { nanoid } from "nanoid";
import { rmSync } from "node:fs";
import { SUPPORTED_LANGUAGES } from "../constants/index.ts";
import {
  closeDatabaseClient,
  DATABASE_PATH,
  getDatabaseClient,
  RECORDINGS_DIRECTORY_PATH,
} from "./client.ts";
import type {
  AIProvider,
  Configuration,
  SessionFeedback,
  SupportedLanguage,
  Topic,
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
    SUPPORTED_LANGUAGES.map((language, index) => [language.code, index])
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
  proficiency: number;
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
  topicId: string | null;
  transcriptText: string | null;
  audioDurationMs: number;
  audioFilePath: string;
  wordCount: number | null;
}): UserSession {
  const {
    userId,
    userTrackId,
    topicId,
    transcriptText,
    audioDurationMs,
    audioFilePath,
    wordCount,
  } = input;
  const db = getDatabaseClient();

  const session: UserSession = {
    id: nanoid(),
    userId,
    userTrackId,
    topicId,
    transcriptText,
    audioDurationMs,
    audioFilePath,
    wordCount,
  };

  db.prepare(
    "INSERT INTO user_sessions (id, user_id, user_track_id, topic_id, transcriptText, audioDurationMs, audioFilePath, wordCount) VALUES (@id, @userId, @userTrackId, @topicId, @transcriptText, @audioDurationMs, @audioFilePath, @wordCount)"
  ).run(session);

  return session;
}

export function getTrackVocabularyWords(userTrackId: string): string[] {
  const db = getDatabaseClient();
  const rows = db
    .prepare(
      "SELECT word FROM vocabulary WHERE user_track_id = ? ORDER BY usage_count DESC, word ASC"
    )
    .all(userTrackId) as Array<{ word: string }>;
  return rows.map((row) => row.word);
}

export function getTrackGrammarPatternTypes(userTrackId: string): string[] {
  const db = getDatabaseClient();
  const rows = db
    .prepare(
      "SELECT pattern_type FROM grammar_patterns WHERE user_track_id = ? ORDER BY occurrences DESC, pattern_type ASC"
    )
    .all(userTrackId) as Array<{ pattern_type: string }>;
  return rows.map((row) => row.pattern_type);
}

export function saveSessionFeedback(input: {
  userSessionId: string;
  userTrackId: string;
  feedback: SessionFeedback;
}) {
  const db = getDatabaseClient();
  const writeFeedback = db.transaction(() => {
    db.prepare(
      `UPDATE user_sessions
       SET feedback_status = 'completed',
           feedback_error = NULL,
           feedback_summary = ?,
           detected_language = ?,
           feedback_confidence_score = ?
       WHERE id = ?`
    ).run(
      input.feedback.summary,
      input.feedback.detectedLanguage,
      input.feedback.confidenceScore,
      input.userSessionId
    );

    const insertSentenceRewrite = db.prepare(
      `INSERT INTO sentence_rewrites (
        id,
        user_session_id,
        user_track_id,
        original_sentence,
        improved_sentence,
        reason
      ) VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const rewrite of input.feedback.sentenceRewrites) {
      insertSentenceRewrite.run(
        nanoid(),
        input.userSessionId,
        input.userTrackId,
        rewrite.original,
        rewrite.improved,
        rewrite.reason
      );
    }

    const upsertVocabulary = db.prepare(
      `INSERT INTO vocabulary (
        id,
        user_track_id,
        word,
        meaning,
        example,
        usage_count,
        first_seen_at,
        last_seen_at
      ) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_track_id, word) DO UPDATE SET
        meaning = excluded.meaning,
        example = excluded.example,
        usage_count = vocabulary.usage_count + 1,
        last_seen_at = CURRENT_TIMESTAMP`
    );
    for (const vocab of input.feedback.vocabulary) {
      const normalizedWord = normalizeKey(vocab.word);
      if (!normalizedWord) {
        continue;
      }
      upsertVocabulary.run(
        nanoid(),
        input.userTrackId,
        normalizedWord,
        vocab.meaning,
        vocab.example
      );
    }

    const upsertGrammarPattern = db.prepare(
      `INSERT INTO grammar_patterns (
        id,
        user_track_id,
        pattern_type,
        explanation,
        occurrences,
        first_seen_at,
        last_seen_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_track_id, pattern_type) DO UPDATE SET
        explanation = excluded.explanation,
        occurrences = grammar_patterns.occurrences + excluded.occurrences,
        last_seen_at = CURRENT_TIMESTAMP`
    );
    for (const pattern of input.feedback.grammarPatterns) {
      const normalizedPatternType = normalizeKey(pattern.patternType);
      if (!normalizedPatternType) {
        continue;
      }
      upsertGrammarPattern.run(
        nanoid(),
        input.userTrackId,
        normalizedPatternType,
        pattern.explanation,
        Math.max(1, pattern.occurrences)
      );
    }

    recomputeTrackProficiencyFromRecentFeedback(input.userTrackId);
  });

  writeFeedback();
}

export function markSessionFeedbackFailed(input: {
  userSessionId: string;
  errorMessage: string;
}) {
  const db = getDatabaseClient();
  db.prepare(
    `UPDATE user_sessions
     SET feedback_status = 'failed',
         feedback_error = ?
     WHERE id = ?`
  ).run(input.errorMessage, input.userSessionId);
}

export function saveConfiguration(config: Configuration) {
  const db = getDatabaseClient();

  db.exec("DELETE FROM configuration");
  db.prepare(
    "INSERT INTO configuration (openAIKey, anthropicKey, defaultModel, transcriptionChoice) VALUES (@openAIKey, @anthropicKey, @defaultModel, @transcriptionChoice)"
  ).run(config);
}

export function getConfiguration(): Configuration {
  const db = getDatabaseClient();
  return toConfiguration(readConfigurationRow(db));
}

export function getTranscriptionChoice(): TranscriptionChoice {
  const db = getDatabaseClient();
  const row = db
    .prepare("SELECT transcriptionChoice FROM configuration LIMIT 1")
    .get() as { transcriptionChoice: TranscriptionChoice } | undefined;
  return row?.transcriptionChoice ?? null;
}

export function getOpenAIKey(): string | null {
  const db = getDatabaseClient();
  const row = db
    .prepare("SELECT openAIKey FROM configuration LIMIT 1")
    .get() as { openAIKey: string | null } | undefined;
  return row?.openAIKey ?? null;
}

export function setTranscriptionChoice(
  choice: Exclude<TranscriptionChoice, null>
) {
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

export function listUserTracksByUserId(userId: string): Array<
  UserTrack & { languageLabel: string }
> {
  const db = getDatabaseClient();
  return db
    .prepare(
      `SELECT
        t.id,
        t.user_id as userId,
        l.code as language,
        l.label as languageLabel,
        t.proficiency
      FROM user_tracks t
      JOIN supported_languages l ON l.id = t.language_id
      WHERE t.user_id = ?
      ORDER BY l.label ASC`
    )
    .all(userId) as Array<UserTrack & { languageLabel: string }>;
}

export function listTopicSuggestionsForTrack(input: {
  userTrackId: string;
  proficiency: number;
  limit: number;
}): Topic[] {
  const db = getDatabaseClient();
  const rows = db
    .prepare(
      `SELECT
        t.id,
        t.title,
        t.description,
        t.proficiency,
        t.hints_json as hintsJson
      FROM topics t
      WHERE t.id NOT IN (
        SELECT us.topic_id
        FROM user_sessions us
        WHERE us.user_track_id = ?
          AND us.topic_id IS NOT NULL
      )
      ORDER BY
        ABS(t.proficiency - ?) ASC,
        t.proficiency ASC,
        t.title ASC
      LIMIT ?`
    )
    .all(input.userTrackId, input.proficiency, input.limit) as Array<{
    id: string;
    title: string;
    description: string;
    proficiency: number;
    hintsJson: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    proficiency: row.proficiency,
    hints: parseTopicHints(row.hintsJson),
  }));
}

export function getRecentTrackConfidenceScores(
  userTrackId: string,
  limit: number
): number[] {
  const db = getDatabaseClient();
  const rows = db
    .prepare(
      `SELECT feedback_confidence_score
      FROM user_sessions
      WHERE user_track_id = ?
        AND feedback_status = 'completed'
        AND feedback_confidence_score IS NOT NULL
      ORDER BY rowid DESC
      LIMIT ?`
    )
    .all(userTrackId, limit) as Array<{ feedback_confidence_score: number }>;

  return rows.map((row) => row.feedback_confidence_score);
}

export function updateTrackProficiency(userTrackId: string, nextProficiency: number) {
  const db = getDatabaseClient();
  db.prepare("UPDATE user_tracks SET proficiency = ? WHERE id = ?").run(
    nextProficiency,
    userTrackId
  );
}

export function recomputeTrackProficiencyFromRecentFeedback(userTrackId: string) {
  const db = getDatabaseClient();
  const currentTrack = db
    .prepare("SELECT proficiency FROM user_tracks WHERE id = ?")
    .get(userTrackId) as { proficiency: number } | undefined;
  if (!currentTrack) {
    return;
  }

  const recentScores = getRecentTrackConfidenceScores(userTrackId, 5);
  if (recentScores.length < 3) {
    return;
  }

  const averageScore =
    recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  const shouldIncrease = averageScore >= 80;
  const shouldDecrease = averageScore <= 45;
  if (!shouldIncrease && !shouldDecrease) {
    return;
  }

  const delta = shouldIncrease ? 1 : -1;
  const nextProficiency = clampProficiency(currentTrack.proficiency + delta);
  if (nextProficiency === currentTrack.proficiency) {
    return;
  }

  updateTrackProficiency(userTrackId, nextProficiency);
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

    // Only overwrite keys explicitly provided by the wizard.
    // `undefined` means "keep current value"; `null` means "clear it".
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

function ensureConfigurationRow(
  db: ReturnType<typeof getDatabaseClient>
): ConfigRow {
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

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

function clampProficiency(value: number) {
  return Math.min(10, Math.max(1, value));
}

function parseTopicHints(hintsJson: string): string[] {
  try {
    const parsed = JSON.parse(hintsJson) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((hint): hint is string => typeof hint === "string");
  } catch {
    return [];
  }
}
