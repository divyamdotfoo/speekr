import { Box, Text, render } from "ink";
import { theme } from "../theme/tokens.ts";

const logoLines = [
  "  _____  _____  ______  ______  _  __  _____  ",
  " / ____||  __ \\|  ____||  ____|| |/ / |  __ \\ ",
  "| (___  | |__) | |__   | |__   | ' /  | |__) |",
  " \\___ \\ |  ___/|  __|  |  __|  |  <   |  _  / ",
  " ____) || |    | |____ | |____ | . \\  | | \\ \\ ",
  "|_____/ |_|    |______||______||_|\\_\\ |_|  \\_\\",
] as const;

const commands = [
  { name: "start", description: "Start the application" },
  { name: "setup", description: "Run guided setup" },
  { name: "config", description: "Update saved configuration" },
  { name: "record", description: "Start a new learning session" },
  { name: "list", description: "List learning sessions" },
  { name: "reset", description: "Delete local database and recordings" },
] as const;

function HomeScreen() {
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box
        borderStyle="round"
        borderColor={theme.muted}
        flexDirection="column"
        paddingX={2}
        paddingY={1}
      >
        <Box flexDirection="column" marginBottom={1}>
          {logoLines.map((line, index) => (
            <Text
              key={line}
              color={index % 2 === 0 ? theme.brand : theme.accent}
            >
              {line}
            </Text>
          ))}
        </Box>

        <Text color={theme.text}>Practice speaking languages locally.</Text>
        <Text color={theme.muted}>
          {"Run `speekr <command>` to get started."}
        </Text>

        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.brand}>Available commands</Text>
          {commands.map((command) => (
            <Box key={command.name}>
              <Text color={theme.accent}> {command.name.padEnd(8, " ")}</Text>
              <Text color={theme.text}>{command.description}</Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text color={theme.muted}>
            Tip: use `speekr --help` for detailed help.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export function renderHomeScreen() {
  render(<HomeScreen />);
}
