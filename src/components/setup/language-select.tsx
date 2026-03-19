import { Box, Text, useInput } from "ink";
import { useEffect, useMemo, useState } from "react";
import type { SupportedLanguage } from "../../types/index.ts";
import { theme } from "../theme/tokens.ts";

export function LanguageSelect({
  languages,
  onSelect,
}: {
  languages: SupportedLanguage[];
  onSelect: (language: SupportedLanguage) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

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
      const selected = filteredLanguages[selectedIndex];
      if (selected) {
        onSelect(selected);
      }
      return;
    }

    if (key.upArrow) {
      if (filteredLanguages.length === 0) {
        return;
      }
      setSelectedIndex((current) =>
        current <= 0 ? filteredLanguages.length - 1 : current - 1,
      );
      return;
    }

    if (key.downArrow) {
      if (filteredLanguages.length === 0) {
        return;
      }
      setSelectedIndex((current) =>
        current >= filteredLanguages.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (key.backspace || key.delete) {
      setQuery((current) => current.slice(0, -1));
      return;
    }

    if (input && !key.ctrl && !key.meta && !key.escape) {
      setQuery((current) => current + input);
      return;
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.accent}>{">"} </Text>
        <Text color={query ? theme.text : theme.muted}>
          {query || "Search languages..."}
        </Text>
      </Box>

      {filteredLanguages.length === 0 ? (
        <Box marginTop={1}>
          <Text color={theme.muted}>No matching languages. Try a different search.</Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          {filteredLanguages.map((lang, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box key={lang.id}>
                <Text color={isSelected ? theme.accent : theme.muted}>
                  {isSelected ? "● " : "○ "}
                </Text>
                <Text color={isSelected ? theme.text : theme.muted}>
                  {lang.label} ({lang.code})
                </Text>
              </Box>
            );
          })}
          <Box marginTop={1}>
            <Text color={theme.muted}>
              Type to search. Use ↑/↓ to navigate, Enter to select.
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
