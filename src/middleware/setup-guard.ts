import { CommanderError, type Command } from "commander";
import { runSetupFlow } from "../commands/shared/run-setup-flow.tsx";
import { isSetupComplete } from "../db/queries.ts";

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
