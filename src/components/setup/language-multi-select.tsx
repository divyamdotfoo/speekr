import { Box, Text, useInput } from "ink";
import { useEffect, useMemo, useState } from "react";
import type { SupportedLanguage } from "../../types/index.ts";
import { theme } from "../theme/tokens.ts";

const badgeColors = [
  theme.accent,
  theme.brand,
  theme.success,
  theme.warning,
] as const;

export function LanguageMultiSelect({
  languages,
  initialSelectedLanguageIds = [],
  onSubmit,
}: {
  languages: SupportedLanguage[];
  initialSelectedLanguageIds?: string[];
  onSubmit: (selectedLanguageIds: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState(
    new Set(initialSelectedLanguageIds)
  );

  const filteredLanguages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? languages.filter((lang) => {
          return (
            lang.label.toLowerCase().includes(normalized) ||
            lang.code.toLowerCase().includes(normalized)
          );
        })
      : languages;
  }, [languages, query]);

  const selectedLanguages = useMemo(
    () => languages.filter((language) => selectedLanguageIds.has(language.id)),
    [languages, selectedLanguageIds]
  );

  useEffect(() => {
    setSelectedIndex((current) => {
      if (filteredLanguages.length === 0) {
        return 0;
      }
      return Math.min(current, filteredLanguages.length - 1);
    });
  }, [filteredLanguages]);

  useInput((input, key) => {
    if (key.return) {
      if (selectedLanguageIds.size > 0) {
        onSubmit(Array.from(selectedLanguageIds));
      }
      return;
    }

    if (key.upArrow) {
      if (filteredLanguages.length === 0) {
        return;
      }
      setSelectedIndex((current) =>
        current <= 0 ? filteredLanguages.length - 1 : current - 1
      );
      return;
    }

    if (key.downArrow) {
      if (filteredLanguages.length === 0) {
        return;
      }
      setSelectedIndex((current) =>
        current >= filteredLanguages.length - 1 ? 0 : current + 1
      );
      return;
    }

    if (key.backspace || key.delete) {
      setQuery((current) => current.slice(0, -1));
      return;
    }

    if (input.toLowerCase() === "y" || input.toLowerCase() === "n") {
      const highlighted = filteredLanguages[selectedIndex];
      if (!highlighted) {
        return;
      }
      setSelectedLanguageIds((current) => {
        const next = new Set(current);
        if (input.toLowerCase() === "y") {
          next.add(highlighted.id);
        } else {
          next.delete(highlighted.id);
        }
        return next;
      });
      return;
    }

    if (input && !key.ctrl && !key.meta && !key.escape) {
      setQuery((current) => current + input);
      return;
    }
  });

  return (
    <Box flexDirection="column">
      <Box
        borderStyle="round"
        borderColor={theme.muted}
        flexDirection="column"
        paddingX={1}
        paddingY={0}
      >
        <Box>
          <Text color={theme.brand}>
            Selected ({selectedLanguages.length}):{" "}
          </Text>
          {selectedLanguages.length === 0 ? (
            <Text color={theme.muted}>none yet</Text>
          ) : (
            selectedLanguages.map((language, index) => (
              <Text
                key={language.id}
                color={badgeColors[index % badgeColors.length]}
              >
                [{language.label}]
                {index < selectedLanguages.length - 1 ? " " : ""}
              </Text>
            ))
          )}
        </Box>
      </Box>
      <Box>
        <Text color={theme.accent}>{">"} </Text>
        <Text color={query ? theme.text : theme.muted}>
          {query || "Search languages..."}
        </Text>
      </Box>

      {filteredLanguages.length === 0 ? (
        <Box marginTop={1}>
          <Text color={theme.muted}>
            No matching languages. Try a different search.
          </Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          {filteredLanguages.map((lang, index) => {
            const isActive = index === selectedIndex;
            const isChecked = selectedLanguageIds.has(lang.id);
            return (
              <Box key={lang.id}>
                <Text color={isActive ? theme.accent : theme.muted}>
                  {isActive ? "▸ " : "  "}
                </Text>
                <Text color={isChecked ? theme.success : theme.muted}>
                  {isChecked ? "[yes] " : "[no ] "}
                </Text>
                <Text color={isActive ? theme.text : theme.muted}>
                  {lang.label} ({lang.code})
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      <Box marginTop={1} />
    </Box>
  );
}
