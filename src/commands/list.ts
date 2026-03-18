import type { Command } from "commander";
import { renderCommandScreen } from "../components/layout/command-screen.tsx";
import type { CommandRegistrar } from "./types.ts";

export const registerListCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("list")
    .description("List learning sessions")
    .action(() => {
      renderCommandScreen({
        title: "Session history",
        subtitle: "list",
        tone: "info",
        statusLabel: "No sessions yet",
        message: "Start with `speekr record` to create your first practice session.",
      });
    });
};
