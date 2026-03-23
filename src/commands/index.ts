import type { Command } from "commander";
import { registerRecordCommand } from "./record/index.ts";
import { registerResetCommand } from "./reset/index.ts";
import { registerSetupCommand, applySetupGuard } from "./setup/index.ts";

export function registerCommands(program: Command) {
  applySetupGuard(program);
  registerSetupCommand(program);
  registerResetCommand(program);
  registerRecordCommand(program);
}
