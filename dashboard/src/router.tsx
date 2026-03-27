import { createRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "./routes/__root";
import { Route as indexRoute } from "./routes/index";
import { Route as vocabularyRoute } from "./routes/vocabulary.$trackId";
import { Route as grammarRoute } from "./routes/grammar.$trackId";
import { Route as sessionsRoute } from "./routes/sessions.$trackId";
import { Route as rewritesRoute } from "./routes/rewrites.$trackId";
import { Route as topicsRoute } from "./routes/topics.$trackId";
import { Route as statsRoute } from "./routes/stats.$trackId";

const routeTree = rootRoute.addChildren([
  indexRoute,
  vocabularyRoute,
  grammarRoute,
  sessionsRoute,
  rewritesRoute,
  topicsRoute,
  statsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
