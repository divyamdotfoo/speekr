import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { RewritesView } from "../views/RewritesView";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rewrites/$trackId",
  component: RewritesView,
});
