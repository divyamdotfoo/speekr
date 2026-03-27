import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { MindMapFlow } from "../components/MindMapFlow";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MindMapFlow,
});
