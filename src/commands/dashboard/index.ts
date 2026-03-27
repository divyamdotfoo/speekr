import type { Command } from "commander";

import { startDashboardServer } from "../../server/app.ts";
import { openUrl, parsePort } from "./utils.ts";

export function registerDashboardCommand(program: Command) {
  return program
    .command("dashboard")
    .description("Start the local dashboard server")
    .option("-p, --port <port>", "Dashboard port", parsePort, 4000)
    .action(async (options: { port: number }) => {
      const server = startDashboardServer(options.port);
      const url = `http://localhost:${String(options.port)}`;

      server.on("listening", () => {
        process.stdout.write(`Dashboard running at ${url}\n`);
        openUrl(url);
      });

      server.on("error", (error) => {
        process.stderr.write(`Failed to start dashboard: ${String(error)}\n`);
        process.exitCode = 1;
      });
    });
}
