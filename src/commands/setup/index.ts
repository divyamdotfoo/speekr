import { CommanderError, type Command } from "commander";
import type { CommandRegistrar } from "../types.ts";
import { runSetupCommandFlow } from "./utils.ts";
import { isSetupComplete } from "../../db/queries.ts";
import { runSetupFlow } from "../../components/setup/setup-wizard.tsx";

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

    if (isSetupComplete()) {
      return;
    }

    const didCompleteSetup = await runSetupFlow(commandName);
    if (!didCompleteSetup) {
      throw new CommanderError(
        1,
        "setup_incomplete",
        "Setup is required before running this command."
      );
    }
  });
}
