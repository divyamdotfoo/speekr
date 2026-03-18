import type { Command } from "commander";
import { renderCommandScreen } from "../components/layout/command-screen.tsx";
import type { CommandRegistrar } from "./types.ts";

export const registerStartCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("start")
    .description("Start the application")
    .action(() => {
      renderCommandScreen({
        title: "Session ready",
        subtitle: "start",
        tone: "success",
        statusLabel: "Environment initialized",
        message: "Your language practice environment is ready.",
      });
    });
};
