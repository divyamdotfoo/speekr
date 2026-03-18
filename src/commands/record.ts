import type { Command } from "commander";
import { renderCommandScreen } from "../components/layout/command-screen.tsx";
import type { CommandRegistrar } from "./types.ts";

export const registerRecordCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("record")
    .description("Start a new learning session")
    .action(() => {
      renderCommandScreen({
        title: "Recording",
        subtitle: "record",
        tone: "info",
        statusLabel: "Capture started",
        message: "Recording pipeline will attach here in the next iteration.",
      });
    });
};
