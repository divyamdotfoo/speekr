import express, { type Express } from "express";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { findUpSync } from "find-up";
import { DATABASE_PATH, RECORDINGS_DIRECTORY_PATH } from "../db/client.ts";
import { APP_NAME } from "../constants/index.ts";

type DashboardHealthResponse = {
  status: "ok";
  appName: string;
};

type DashboardPathsResponse = {
  databasePath: string;
  recordingsDirectoryPath: string;
};

type CreateDashboardServerOptions = {
  dashboardDevServerUrl?: string;
};

export function createDashboardServer(
  options?: CreateDashboardServerOptions
): Express {
  const app = express();
  const staticDirectory = resolveDashboardDistDirectory();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    const payload: DashboardHealthResponse = {
      status: "ok",
      appName: APP_NAME,
    };
    res.json(payload);
  });

  app.get("/api/paths", (_req, res) => {
    const payload: DashboardPathsResponse = {
      databasePath: DATABASE_PATH,
      recordingsDirectoryPath: RECORDINGS_DIRECTORY_PATH,
    };
    res.json(payload);
  });

  if (staticDirectory) {
    app.use(express.static(staticDirectory));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(join(staticDirectory, "index.html"));
    });
  } else if (options?.dashboardDevServerUrl) {
    app.get("/{*path}", (req, res) => {
      const target = new URL(req.originalUrl, options.dashboardDevServerUrl);
      res.redirect(target.toString());
    });
  } else {
    app.get("/{*path}", (_req, res) => {
      res.status(404).json({
        error: "Dashboard build not found. Run `pnpm build:dashboard`.",
      });
    });
  }

  return app;
}

export function startDashboardServer(
  port: number,
  options?: CreateDashboardServerOptions
) {
  const app = createDashboardServer(options);
  return app.listen(port);
}

function resolveDashboardDistDirectory() {
  const packageJsonPath = findUpSync("package.json", {
    cwd: dirname(fileURLToPath(import.meta.url)),
  });
  if (!packageJsonPath) {
    return null;
  }

  const packageRoot = dirname(packageJsonPath);
  const dashboardDistDirectory = join(packageRoot, "dashboard", "dist");
  if (!existsSync(join(dashboardDistDirectory, "index.html"))) {
    return null;
  }
  return dashboardDistDirectory;
}
