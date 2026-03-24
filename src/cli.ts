import { Command, CommanderError } from "commander";
import { registerCommands } from "./commands/index.ts";
import { renderErrorScreen } from "./components/layout/error-screen.tsx";
import { renderHomeScreen } from "./components/layout/home-screen.tsx";
import { formatUserFacingError } from "./lib/errors.ts";

export async function cli() {
  if (process.argv.slice(2).length === 0) {
    renderHomeScreen();
    return;
  }

  const program = new Command();

  program.name("speekr").description("Practice speaking languages locally");
  registerCommands(program);

  const handleTopLevelError = (error: unknown) => {
    const friendly = formatUserFacingError(error);
    renderErrorScreen({
      title: friendly.title,
      subtitle: "cli",
      statusLabel: friendly.statusLabel,
      message: friendly.message,
    });
    process.exitCode = 1;
  };

  process.once("uncaughtException", handleTopLevelError);
  process.once("unhandledRejection", handleTopLevelError);

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      renderErrorScreen({
        title: "Command error",
        subtitle: "cli",
        statusLabel: "Invalid command usage",
        message: error.message,
      });
      process.exitCode = error.exitCode;
      return;
    }
    handleTopLevelError(error);
  } finally {
    process.removeListener("uncaughtException", handleTopLevelError);
    process.removeListener("unhandledRejection", handleTopLevelError);
  }
}
