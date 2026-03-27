import { useEffect, useState } from "react";

type DashboardHealthResponse = {
  status: "ok";
  appName: string;
};

type DashboardPathsResponse = {
  databasePath: string;
  recordingsDirectoryPath: string;
};

export function App() {
  const [health, setHealth] = useState<DashboardHealthResponse | null>(null);
  const [paths, setPaths] = useState<DashboardPathsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/health").then(
        (response) => response.json() as Promise<DashboardHealthResponse>
      ),
      fetch("/api/paths").then(
        (response) => response.json() as Promise<DashboardPathsResponse>
      ),
    ])
      .then(([healthPayload, pathsPayload]) => {
        setHealth(healthPayload);
        setPaths(pathsPayload);
      })
      .catch((fetchError: unknown) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unknown dashboard error"
        );
      });
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Speekr</h1>
        <p>Local status and storage details from your running CLI server.</p>
      </header>

      {error ? <section className="card error">{error}</section> : null}

      <section className="grid">
        <article className="card">
          <h2>Server Health</h2>
          <p>Status: {health?.status ?? "loading..."}</p>
          <p>App: {health?.appName ?? "loading..."}</p>
        </article>

        <article className="card">
          <h2>Local Paths</h2>
          <p>Database: {paths?.databasePath ?? "loading..."}</p>
          <p>Recordings: {paths?.recordingsDirectoryPath ?? "loading..."}</p>
        </article>
      </section>
    </main>
  );
}
