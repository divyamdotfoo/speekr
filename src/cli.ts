import { Command, CommanderError } from "commander";
import { registerCommands } from "./commands/index.ts";
import { renderHomeScreen } from "./components/layout/home-screen.tsx";

export async function cli() {
  if (process.argv.slice(2).length === 0) {
    renderHomeScreen();
    return;
  }

  const program = new Command();

  program.name("speekr").description("Practice speaking languages locally");
  registerCommands(program);

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
