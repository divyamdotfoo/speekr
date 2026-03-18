import type { Command } from "commander";
import { renderCommandScreen } from "../components/layout/command-screen.tsx";
import { runSetupFlow } from "./shared/run-setup-flow.tsx";
import type { CommandRegistrar } from "./types.ts";

export const registerSetupCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("setup")
    .description("Run guided setup")
    .action(async () => {
      const wasSaved = await runSetupFlow("setup");
      if (!wasSaved) {
        renderCommandScreen({
          title: "Setup cancelled",
          tone: "warning",
          statusLabel: "Configuration incomplete",
          message: "Run `speekr setup` again whenever you are ready.",
        });
      }
    });
};
