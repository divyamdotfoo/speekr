import { nanoid } from "nanoid";
import { getDatabaseClient } from "../client.ts";
import type { SessionFeedback, UserSession } from "../../types/index.ts";

class SessionService {
  createUserSession(input: {
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

  saveSessionFeedback(input: {
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

      this.recomputeTrackProficiencyFromRecentFeedback(input.userTrackId);
    });

    writeFeedback();
  }

  markSessionFeedbackFailed(input: {
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

  getRecentTrackConfidenceScores(userTrackId: string, limit: number): number[] {
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

  updateTrackProficiency(userTrackId: string, nextProficiency: number) {
    const db = getDatabaseClient();
    db.prepare("UPDATE user_tracks SET proficiency = ? WHERE id = ?").run(
      nextProficiency,
      userTrackId
    );
  }

  recomputeTrackProficiencyFromRecentFeedback(userTrackId: string) {
    const db = getDatabaseClient();
    const currentTrack = db
      .prepare("SELECT proficiency FROM user_tracks WHERE id = ?")
      .get(userTrackId) as { proficiency: number } | undefined;
    if (!currentTrack) {
      return;
    }

    const recentScores = this.getRecentTrackConfidenceScores(userTrackId, 5);
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

    this.updateTrackProficiency(userTrackId, nextProficiency);
  }

  listSessionsByTrack(trackId: string) {
    const db = getDatabaseClient();
    return db
      .prepare(
        `SELECT
          id,
          user_id as userId,
          user_track_id as userTrackId,
          topic_id as topicId,
          transcriptText,
          audioDurationMs,
          audioFilePath,
          wordCount,
          feedback_status as feedbackStatus,
          feedback_summary as feedbackSummary,
          detected_language as detectedLanguage,
          feedback_confidence_score as feedbackConfidenceScore,
          rowid as createdAt
        FROM user_sessions
        WHERE user_track_id = ?
        ORDER BY rowid DESC`
      )
      .all(trackId) as Array<{
      id: string;
      userId: string;
      userTrackId: string;
      topicId: string | null;
      transcriptText: string | null;
      audioDurationMs: number;
      audioFilePath: string;
      wordCount: number | null;
      feedbackStatus: string;
      feedbackSummary: string | null;
      detectedLanguage: string | null;
      feedbackConfidenceScore: number | null;
      createdAt: number;
    }>;
  }

  getSessionWithDetails(sessionId: string) {
    const db = getDatabaseClient();
    const session = db
      .prepare(
        `SELECT
          id,
          user_id as userId,
          user_track_id as userTrackId,
          topic_id as topicId,
          transcriptText,
          audioDurationMs,
          audioFilePath,
          wordCount,
          feedback_status as feedbackStatus,
          feedback_summary as feedbackSummary,
          detected_language as detectedLanguage,
          feedback_confidence_score as feedbackConfidenceScore
        FROM user_sessions
        WHERE id = ?`
      )
      .get(sessionId) as
      | {
          id: string;
          userId: string;
          userTrackId: string;
          topicId: string | null;
          transcriptText: string | null;
          audioDurationMs: number;
          audioFilePath: string;
          wordCount: number | null;
          feedbackStatus: string;
          feedbackSummary: string | null;
          detectedLanguage: string | null;
          feedbackConfidenceScore: number | null;
        }
      | undefined;

    if (!session) {
      return null;
    }

    const rewrites = db
      .prepare(
        `SELECT
          id,
          original_sentence as original,
          improved_sentence as improved,
          reason
        FROM sentence_rewrites
        WHERE user_session_id = ?`
      )
      .all(sessionId) as Array<{
      id: string;
      original: string;
      improved: string;
      reason: string;
    }>;

    return { ...session, rewrites };
  }

  getTrackStats(trackId: string) {
    const db = getDatabaseClient();
    const stats = db
      .prepare(
        `SELECT
          COUNT(*) as totalSessions,
          SUM(audioDurationMs) as totalDurationMs,
          AVG(CASE WHEN feedback_confidence_score IS NOT NULL THEN feedback_confidence_score END) as avgConfidence,
          COUNT(CASE WHEN feedback_status = 'completed' THEN 1 END) as completedSessions
        FROM user_sessions
        WHERE user_track_id = ?`
      )
      .get(trackId) as
      | {
          totalSessions: number;
          totalDurationMs: number | null;
          avgConfidence: number | null;
          completedSessions: number;
        }
      | undefined;

    return stats ?? { totalSessions: 0, totalDurationMs: 0, avgConfidence: 0, completedSessions: 0 };
  }

  getSessionTrendData(trackId: string, days: number = 30) {
    const db = getDatabaseClient();
    return db
      .prepare(
        `SELECT
          DATE(rowid / 86400000, 'unixepoch') as date,
          COUNT(*) as count,
          AVG(CASE WHEN feedback_confidence_score IS NOT NULL THEN feedback_confidence_score END) as avgConfidence
        FROM user_sessions
        WHERE user_track_id = ?
          AND rowid >= ?
        GROUP BY DATE(rowid / 86400000, 'unixepoch')
        ORDER BY date ASC`
      )
      .all(trackId, Date.now() - days * 24 * 60 * 60 * 1000) as Array<{
      date: string;
      count: number;
      avgConfidence: number | null;
    }>;
  }

  listSentenceRewritesByTrack(trackId: string) {
    const db = getDatabaseClient();
    return db
      .prepare(
        `SELECT
          sr.id,
          sr.user_session_id as userSessionId,
          sr.original_sentence as original,
          sr.improved_sentence as improved,
          sr.reason,
          sr.created_at as createdAt
        FROM sentence_rewrites sr
        WHERE sr.user_track_id = ?
        ORDER BY sr.created_at DESC`
      )
      .all(trackId) as Array<{
      id: string;
      userSessionId: string;
      original: string;
      improved: string;
      reason: string;
      createdAt: string;
    }>;
  }
}

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

function clampProficiency(value: number) {
  return Math.min(10, Math.max(1, value));
}

export const session = new SessionService();

