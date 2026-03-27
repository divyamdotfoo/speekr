import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { StatsView } from "../views/StatsView";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stats/$trackId",
  component: StatsView,
});
