import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes" }] }),
  component: () => <Navigate to="/dashboard" />,
});