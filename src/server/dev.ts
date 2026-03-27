import { startDashboardServer } from "./app.ts";

const port = Number.parseInt(process.env.SPEEKR_DASHBOARD_PORT ?? "4000", 10);
const dashboardDevServerUrl = "http://localhost:5173";
const server = startDashboardServer(port, { dashboardDevServerUrl });

server.on("listening", () => {
  process.stdout.write(
    `Dashboard API server on http://localhost:${String(port)} (frontend dev server: ${dashboardDevServerUrl})\n`
  );
});

server.on("error", (error) => {
  process.stderr.write(`Dashboard API server failed: ${String(error)}\n`);
  process.exitCode = 1;
});
