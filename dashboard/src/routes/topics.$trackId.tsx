import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { TopicsView } from "../views/TopicsView";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/topics/$trackId",
  component: TopicsView,
});
