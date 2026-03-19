import type { Command } from "commander";
import {
  promptResetConfirmation,
  renderResetOutcomeScreen,
} from "../components/reset/reset-flow.tsx";
import { resetDatabase } from "../db/queries.ts";
import type { CommandRegistrar } from "./types.ts";

export const registerResetCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("reset")
    .description("Delete local database and recordings")
    .action(async () => {
      const shouldReset = await promptResetConfirmation();
      if (!shouldReset) {
        renderResetOutcomeScreen({ wasReset: false });
        return;
      }

      resetDatabase();
      renderResetOutcomeScreen({ wasReset: true });
    });
};
