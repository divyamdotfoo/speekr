import type { Command } from "commander";
import type { CommandRegistrar } from "../types.ts";
import { runConfigCommandFlow } from "./utils.ts";

export const registerConfigCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("config")
    .description("Update your saved configuration")
    .action(async () => {
      await runConfigCommandFlow();
    });
};
