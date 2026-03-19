import type { Command } from "commander";
import type { CommandRegistrar } from "../types.ts";
import { runResetCommandFlow } from "./utils.ts";

export const registerResetCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("reset")
    .description("Delete local database and recordings")
    .action(async () => {
      await runResetCommandFlow();
    });
};
