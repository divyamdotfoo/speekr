import type { Command } from "commander";
import { registerListCommand } from "./list.ts";
import { registerRecordCommand } from "./record.ts";
import { registerResetCommand } from "./reset.ts";
import { registerSetupCommand } from "./setup.ts";
import { registerStartCommand } from "./start.ts";

export function registerCommands(program: Command) {
  registerStartCommand(program);
  registerSetupCommand(program);
  registerResetCommand(program);
  registerRecordCommand(program);
  registerListCommand(program);
}
