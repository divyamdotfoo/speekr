import { Box, Text, render } from "ink";
import type { SessionFeedback } from "../../types/index.ts";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";

export function renderRecordingSavedScreen(input: {
  recordingStatusLabel: string;
  recordingDurationMs: number;
  progressStatusLabel: string;
  spokenText: string | null;
  feedback?: SessionFeedback | null;
  feedbackError?: string | null;
}) {
  render(
    <AppFrame title="Recording saved" subtitle="record">
      <Box marginBottom={1} flexDirection="column">
        <SectionTitle label="Recording started" />
        <Text color={theme.text}>
          {input.recordingStatusLabel} · Duration:{" "}
          {formatDuration(input.recordingDurationMs)}
        </Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <SectionTitle label="Recording progress" />
        <Text color={theme.text}>{input.progressStatusLabel}</Text>
      </Box>

      <SectionTitle label="What you spoke" />
      <Text color={theme.text}>
        {input.spokenText?.trim() || "No transcription available."}
      </Text>

      <Box marginTop={1} flexDirection="column">
        <SectionTitle label="Sentence rewrites" />
        {input.feedback?.sentenceRewrites?.length ? (
          <Box flexDirection="column">
            {input.feedback.sentenceRewrites.map((rewrite, index) => (
              <Box
                key={`${rewrite.original}-${index}`}
                flexDirection="column"
                marginBottom={1}
              >
                <Box flexDirection="row">
                  <Box
                    flexDirection="column"
                    flexGrow={1}
                    flexShrink={1}
                    flexBasis={0}
                    marginRight={2}
                  >
                    <Text color={theme.muted}>Original</Text>
                    <Text color={theme.text}>{rewrite.original}</Text>
                  </Box>
                  <Box
                    flexDirection="column"
                    flexGrow={1}
                    flexShrink={1}
                    flexBasis={0}
                  >
                    <Text color={theme.muted}>Improved</Text>
                    <Text color={theme.text}>
                      {renderHighlightedVocabulary(
                        rewrite.improved,
                        input.feedback?.vocabulary?.map((item) => item.word) ??
                          []
                      )}
                    </Text>
                  </Box>
                </Box>
                <Text color={theme.muted}>
                  Reason: {rewrite.reason.replace("_", " ")}
                </Text>
              </Box>
            ))}
          </Box>
        ) : (
          <Text color={theme.muted}>
            No significant rewrites for this session.
          </Text>
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <SectionTitle label="Vocabulary" />
        {input.feedback?.vocabulary?.length ? (
          input.feedback.vocabulary.map((item, index) => (
            <Text key={`${item.word}-${index}`} color={theme.text}>
              • <Text color={theme.accent}>{item.word}</Text>: {item.meaning}{" "}
              (e.g. {item.example})
            </Text>
          ))
        ) : (
          <Text color={theme.muted}>No new vocabulary suggestions.</Text>
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <SectionTitle label="Grammar patterns" />
        {input.feedback?.grammarPatterns?.length ? (
          input.feedback.grammarPatterns.map((pattern, index) => (
            <Text key={`${pattern.patternType}-${index}`} color={theme.text}>
              • {pattern.patternType} ({pattern.occurrences}):{" "}
              {pattern.explanation}
            </Text>
          ))
        ) : (
          <Text color={theme.muted}>
            No recurring grammar patterns detected.
          </Text>
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <SectionTitle label="Feedback summary" />
        <Text color={theme.text}>
          {input.feedback?.summary ??
            input.feedbackError ??
            "No feedback summary available."}
        </Text>
      </Box>
    </AppFrame>
  );
}

function SectionTitle(input: { label: string }) {
  return <Text color={theme.muted}>{input.label}</Text>;
}

function renderHighlightedVocabulary(text: string, words: string[]) {
  const normalizedWords = Array.from(
    new Set(
      words
        .map((word) => word.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)
    )
  );
  if (!normalizedWords.length) {
    return text;
  }

  const pattern = normalizedWords.map(escapeRegExp).join("|");
  const matcher = new RegExp(`(${pattern})`, "gi");
  const segments = text.split(matcher);
  return segments.map((segment, index) => {
    if (
      normalizedWords.some(
        (word) =>
          word.localeCompare(segment, undefined, { sensitivity: "accent" }) ===
            0 || word.toLocaleLowerCase() === segment.toLocaleLowerCase()
      )
    ) {
      return (
        <Text key={`${segment}-${index}`} color={theme.accent}>
          {segment}
        </Text>
      );
    }
    return <Text key={`${segment}-${index}`}>{segment}</Text>;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
