import { SUPPORTED_LANGUAGES } from "../../constants/index.ts";
import { getDatabaseClient } from "../client.ts";
import type { SupportedLanguage, Topic } from "../../types/index.ts";

class LearningService {
  listSupportedLanguages(): SupportedLanguage[] {
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

  getTrackVocabularyWords(userTrackId: string): string[] {
    const db = getDatabaseClient();
    const rows = db
      .prepare(
        "SELECT word FROM vocabulary WHERE user_track_id = ? ORDER BY usage_count DESC, word ASC"
      )
      .all(userTrackId) as Array<{ word: string }>;
    return rows.map((row) => row.word);
  }

  getTrackGrammarPatternTypes(userTrackId: string): string[] {
    const db = getDatabaseClient();
    const rows = db
      .prepare(
        "SELECT pattern_type FROM grammar_patterns WHERE user_track_id = ? ORDER BY occurrences DESC, pattern_type ASC"
      )
      .all(userTrackId) as Array<{ pattern_type: string }>;
    return rows.map((row) => row.pattern_type);
  }

  listTopicSuggestionsForTrack(input: {
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

  getVocabularyList(trackId: string) {
    const db = getDatabaseClient();
    return db
      .prepare(
        `SELECT
          id,
          word,
          meaning,
          example,
          usage_count as usageCount,
          first_seen_at as firstSeenAt,
          last_seen_at as lastSeenAt
        FROM vocabulary
        WHERE user_track_id = ?
        ORDER BY usage_count DESC, word ASC`
      )
      .all(trackId) as Array<{
      id: string;
      word: string;
      meaning: string;
      example: string;
      usageCount: number;
      firstSeenAt: string;
      lastSeenAt: string;
    }>;
  }

  getGrammarPatternList(trackId: string) {
    const db = getDatabaseClient();
    return db
      .prepare(
        `SELECT
          id,
          pattern_type as patternType,
          explanation,
          occurrences,
          first_seen_at as firstSeenAt,
          last_seen_at as lastSeenAt
        FROM grammar_patterns
        WHERE user_track_id = ?
        ORDER BY occurrences DESC, pattern_type ASC`
      )
      .all(trackId) as Array<{
      id: string;
      patternType: string;
      explanation: string;
      occurrences: number;
      firstSeenAt: string;
      lastSeenAt: string;
    }>;
  }
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

export const learning = new LearningService();
