import { CommanderError, type Command } from "commander";
import type { CommandRegistrar } from "../types.ts";
import { runRequiredSetupFlow, runSetupCommandFlow } from "./utils.ts";
import { setup } from "../../db/queries/index.ts";

export const registerSetupCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("setup")
    .description("Run guided setup")
    .action(async () => {
      await runSetupCommandFlow();
    });
};

const BYPASS_COMMANDS = new Set(["setup", "reset"]);

export function applySetupGuard(program: Command) {
  program.hook("preAction", async (_, actionCommand) => {
    const commandName = actionCommand.name();
    if (!commandName || BYPASS_COMMANDS.has(commandName)) {
      return;
    }

    if (setup.isSetupComplete()) {
      return;
    }

    const didCompleteSetup = await runRequiredSetupFlow(commandName, false);
    if (!didCompleteSetup) {
      throw new CommanderError(
        1,
        "setup_incomplete",
        "Setup is required before running this command."
      );
    }
  });
}
