import { Command, CommanderError } from "commander";
import { registerCommands } from "./commands/register-commands.ts";
import { applySetupGuard } from "./middleware/setup-guard.ts";

export async function cli() {
  const program = new Command();

  program.name("speekr").description("Practice speaking languages locally");
  registerCommands(program);
  applySetupGuard(program);

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      console.error(error.message);
      process.exitCode = error.exitCode;
      return;
    }

    throw error;
  }
}
