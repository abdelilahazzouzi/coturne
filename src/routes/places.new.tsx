import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { AppLayout } from "@/components/AppLayout";
import { PlaceEditor } from "@/components/PlaceEditor";

export const Route = createFileRoute("/places/new")({
  head: () => ({
    meta: [
      { title: "List a room — Roomies" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AppLayout>
        <PlaceEditor />
      </AppLayout>
    </RequireAuth>
  ),
});
