import type { Command } from "commander";
import { renderCommandScreen } from "../components/layout/command-screen.tsx";
import { resetDatabase } from "../db/queries.ts";
import type { CommandRegistrar } from "./types.ts";

export const registerResetCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("reset")
    .description("Delete the local database")
    .action(() => {
      resetDatabase();
      renderCommandScreen({
        title: "Database reset",
        tone: "success",
        statusLabel: "Local state cleared",
        message:
          "Database removed successfully. Run `speekr setup` or any command to initialize again.",
      });
    });
};
