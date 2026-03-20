import type { Command } from "commander";
import { registerConfigCommand } from "./config/index.ts";
import { registerRecordCommand } from "./record/index.ts";
import { registerResetCommand } from "./reset/index.ts";
import { registerSetupCommand, applySetupGuard } from "./setup/index.ts";

export function registerCommands(program: Command) {
  applySetupGuard(program);
  registerSetupCommand(program);
  registerConfigCommand(program);
  registerResetCommand(program);
  registerRecordCommand(program);
}
