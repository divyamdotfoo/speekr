import type { AIProvider } from "../../types/index.ts";

type AIFetcher = <T>(
  url: string,
  input?: {
    body?: unknown;
    headers?: Record<string, string>;
  }
) => Promise<T>;

export function createCaller(provider: AIProvider, apiKey: string): AIFetcher {
  return async function requestJson<T>(
    url: string,
    input?: {
      body?: unknown;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(input?.headers ?? {}),
    };

    switch (provider) {
      case "openai":
        headers.Authorization = `Bearer ${apiKey}`;
        break;
      case "deepgram":
        headers.Authorization = `Token ${apiKey}`;
        break;
      case "anthropic":
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        headers["content-type"] ??= "application/json";
        break;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: input?.body as any,
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(
        `AI request failed (${response.status} ${response.statusText}): ${raw}`
      );
    }

    return (await response.json()) as T;
  };
}
