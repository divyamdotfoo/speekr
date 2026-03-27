import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { SessionsView } from "../views/SessionsView";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions/$trackId",
  component: SessionsView,
});
