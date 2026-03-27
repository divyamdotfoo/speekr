import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { GrammarView } from "../views/GrammarView";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/grammar/$trackId",
  component: GrammarView,
});
