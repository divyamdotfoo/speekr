import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { VocabularyView } from "../views/VocabularyView";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vocabulary/$trackId",
  component: VocabularyView,
});
