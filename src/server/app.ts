import express, { type Express } from "express";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { findUpSync } from "find-up";
import { DATABASE_PATH, RECORDINGS_DIRECTORY_PATH } from "../db/client.ts";
import { APP_NAME } from "../constants/index.ts";
import { user } from "../db/queries/user.ts";
import { session } from "../db/queries/session.ts";
import { learning } from "../db/queries/learning.ts";

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

  app.get("/api/user", (_req, res) => {
    try {
      const userData = user.getUserWithAllTracks();
      if (!userData) {
        return res.status(404).json({ error: "No user found" });
      }
      res.json(userData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  app.get("/api/stats/:trackId", (req, res) => {
    try {
      const { trackId } = req.params;
      const stats = session.getTrackStats(trackId);

      const vocabCount = learning.getVocabularyList(trackId).length;
      const grammarCount = learning.getGrammarPatternList(trackId).length;

      res.json({
        ...stats,
        vocabCount,
        grammarCount,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/stats/:trackId/trends", (req, res) => {
    try {
      const { trackId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const trends = session.getSessionTrendData(trackId, days);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trends" });
    }
  });

  app.get("/api/vocabulary/:trackId", (req, res) => {
    try {
      const { trackId } = req.params;
      const vocabulary = learning.getVocabularyList(trackId);
      res.json(vocabulary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vocabulary" });
    }
  });

  app.get("/api/grammar/:trackId", (req, res) => {
    try {
      const { trackId } = req.params;
      const patterns = learning.getGrammarPatternList(trackId);
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grammar patterns" });
    }
  });

  app.get("/api/sessions/:trackId", (req, res) => {
    try {
      const { trackId } = req.params;
      const sessions = session.listSessionsByTrack(trackId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:trackId/:sessionId", (req, res) => {
    try {
      const { sessionId } = req.params;
      const sessionDetails = session.getSessionWithDetails(sessionId);
      if (!sessionDetails) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(sessionDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session details" });
    }
  });

  app.get("/api/sentence-rewrites/:trackId", (req, res) => {
    try {
      const { trackId } = req.params;
      const rewrites = session.listSentenceRewritesByTrack(trackId);
      res.json(rewrites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sentence rewrites" });
    }
  });

  app.get("/api/topics/:trackId", (req, res) => {
    try {
      const { trackId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const trackData = user.getPrimaryUserTrack(
        user.getPrimaryUser()?.id || ""
      );
      if (!trackData) {
        return res.status(404).json({ error: "Track not found" });
      }

      const topics = learning.listTopicSuggestionsForTrack({
        userTrackId: trackId,
        proficiency: trackData.proficiency,
        limit,
      });
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topics" });
    }
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
