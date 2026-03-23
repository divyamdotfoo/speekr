import type {
  AIProvider,
  FeedbackInput,
  GrammarPatternInsight,
  SessionFeedback,
  SentenceRewrite,
  SentenceRewriteReason,
  VocabularyInsight,
} from "../../types/index.ts";

type AIFetcher = <T>(
  url: string,
  input?: {
    body?: unknown;
    headers?: Record<string, string>;
  }
) => Promise<T>;

export function createCaller(provider: AIProvider, apiKey: string): AIFetcher {
  return async function requestJson<T>(
    url: string,
    input?: {
      body?: unknown;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(input?.headers ?? {}),
    };

    switch (provider) {
      case "openai":
        headers.Authorization = `Bearer ${apiKey}`;
        break;
      case "deepgram":
        headers.Authorization = `Token ${apiKey}`;
        break;
      case "anthropic":
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        headers["content-type"] ??= "application/json";
        break;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: input?.body as any,
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(
        `AI request failed (${response.status} ${response.statusText}): ${raw}`
      );
    }

    return (await response.json()) as T;
  };
}

export function buildFeedbackPrompt(input: FeedbackInput) {
  const existingVocabularySection = input.existingVocabularyWords?.length
    ? input.existingVocabularyWords.map((word) => `- ${word}`).join("\n")
    : "- None";
  const existingPatternsSection = input.existingGrammarPatternTypes?.length
    ? input.existingGrammarPatternTypes
        .map((pattern) => `- ${pattern}`)
        .join("\n")
    : "- None";

  return `
You are an expert language coach. Your job is to help the user speak more naturally, fluently, and expressively in their target language. Be like a strict but encouraging coach — always push the user toward richer, more natural language.

Detect the language from the input automatically. Return all analysis strictly in that same language.

SENTENCE REWRITES:
- Return a maximum of 5 sentence rewrites per transcription.
- Prefer 4-5 rewrites only when the user made enough high-impact mistakes. If not, return fewer.
- Rewrite sentences where the user could have expressed themselves significantly better — more naturally, more fluently, with stronger vocabulary, or with correct grammar.
- The rewritten sentence should feel like what a confident native speaker would say. The difference between original and improved must be clearly noticeable to the user.
- If a sentence is already well-spoken, skip it. Only include rewrites that genuinely teach the user something.
- Never reference "the transcription" or "the text" in your output. Speak directly about how the user expressed themselves.

VOCABULARY:
- You must always return at least 2-3 vocabulary entries.
- Look at the words the user chose and identify where they used a simpler, weaker, or incorrect word when a better one exists.
- Replace those with stronger, more expressive, or more natural alternatives a fluent speaker would use.
- Every vocabulary entry must come directly from a word substitution made in your sentence rewrites — the word you introduced, not the word the user said.
- Every vocabulary word MUST appear explicitly in at least one "improved" sentence.
- Do not return words the user already knows well or words that appear in the existing vocabulary list.

GRAMMAR PATTERNS:
- Only flag patterns that repeat or are a clear recurring tendency, not one-off mistakes.
- Be specific about the pattern type — not just "grammar error" but "incorrect use of present continuous" or "missing definite article before nouns".

SUMMARY:
- Only include a summary if there is something genuinely useful and encouraging to say.
- Keep it to one sentence. Make it feel human — like a coach wrapping up a session.
- Examples: "Your sentence structure is improving, focus on expanding your verb range next time." or "Great effort — work on article usage and your speech will sound much more natural."
- If the user spoke well overall, a simple positive note is enough. Never force a summary just to fill space.

User proficiency: ${input.proficiency}

Words already in this user's vocabulary (do not repeat these):
${existingVocabularySection}

Grammar patterns already tracked for this user (only return if seen again in this session):
${existingPatternsSection}

Input:
"""
${input.transcription}
"""

Respond ONLY with valid JSON and nothing else:

{
  "detected_language": "string",
  "confidence_score": number (0-100, based on grammar accuracy, vocabulary range, and fluency),
  "sentence_rewrites": [
    {
      "original": "string",
      "improved": "string",
      "reason": "grammar" | "word_choice" | "fluency" | "formality"
    }
  ],
  "vocabulary": [
    {
      "word": "string",
      "meaning": "string",
      "example": "string"
    }
  ],
  "grammar_patterns": [
    {
      "pattern_type": "string",
      "occurrences": number,
      "explanation": "string"
    }
  ],
  "summary": "string | null"
}
`;
}

export function parseSessionFeedback(responseText: string): SessionFeedback {
  const parsed = parseJsonObject(responseText);
  const sentenceRewrites = toSentenceRewrites(parsed.sentence_rewrites).slice(
    0,
    MAX_SENTENCE_REWRITES
  );
  const vocabulary = toVocabulary(parsed.vocabulary).filter((item) =>
    appearsInAnyImprovedSentence(item.word, sentenceRewrites)
  );
  const grammarPatterns = toGrammarPatterns(parsed.grammar_patterns);

  return {
    detectedLanguage: toNonEmptyString(parsed.detected_language, "unknown"),
    confidenceScore: toBoundedScore(parsed.confidence_score),
    sentenceRewrites,
    vocabulary,
    grammarPatterns,
    summary: toNonEmptyString(parsed.summary, "No summary generated."),
  };
}

function parseJsonObject(responseText: string): Record<string, unknown> {
  const trimmed = responseText.trim();
  const jsonBlockMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonPayload = jsonBlockMatch ? jsonBlockMatch[0] : trimmed;
  const parsed = JSON.parse(jsonPayload) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Feedback response must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function toSentenceRewrites(value: unknown): SentenceRewrite[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const row = toObject(item);
      const original = toNonEmptyString(row.original);
      const improved = toNonEmptyString(row.improved);
      const reason = toRewriteReason(row.reason);
      if (!original || !improved || !reason) {
        return null;
      }
      return { original, improved, reason };
    })
    .filter((item): item is SentenceRewrite => item !== null);
}

function toVocabulary(value: unknown): VocabularyInsight[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const row = toObject(item);
      const word = normalizeKey(toNonEmptyString(row.word));
      const meaning = toNonEmptyString(row.meaning);
      const example = toNonEmptyString(row.example);
      if (!word || !meaning || !example) {
        return null;
      }
      return { word, meaning, example };
    })
    .filter((item): item is VocabularyInsight => item !== null);
}

function toGrammarPatterns(value: unknown): GrammarPatternInsight[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const row = toObject(item);
      const patternType = normalizeKey(toNonEmptyString(row.pattern_type));
      const explanation = toNonEmptyString(row.explanation);
      const occurrences = toPositiveInt(row.occurrences, 1);
      if (!patternType || !explanation) {
        return null;
      }
      return { patternType, explanation, occurrences };
    })
    .filter((item): item is GrammarPatternInsight => item !== null);
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function toBoundedScore(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function toPositiveInt(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.round(numeric));
}

function toRewriteReason(value: unknown): SentenceRewriteReason | null {
  if (
    value === "grammar" ||
    value === "word_choice" ||
    value === "fluency" ||
    value === "formality"
  ) {
    return value;
  }
  return null;
}

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

function appearsInAnyImprovedSentence(word: string, rewrites: SentenceRewrite[]) {
  const escapedWord = escapeRegExp(word);
  const matcher = new RegExp(`\\b${escapedWord}\\b`, "i");
  return rewrites.some((rewrite) => matcher.test(rewrite.improved));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MAX_SENTENCE_REWRITES = 5;
