import type { ReactElement } from "react";
import { usePathname, Link } from "@/lib/navigation";
import { Route as IndexRoute } from "./routes/index";
import { Route as LoginRoute } from "./routes/login";
import { Route as AdminRoute } from "./routes/admin";
import { Route as AdminAddRoute } from "./routes/admin-add";
import { Route as DashboardRoute } from "./routes/dashboard";
import { Route as ProfileRoute } from "./routes/profile";
import { Route as SettingsRoute } from "./routes/settings";
import { Route as StudentsRoute } from "./routes/students";
import { Route as NotesRoute } from "./routes/notes";
import { Route as PublicProfileRoute } from "./routes/u";

const routes: Record<string, { component: () => ReactElement }> = {
  "/": IndexRoute as never,
  "/login": LoginRoute as never,
  "/admin": AdminRoute as never,
  "/admin/add": AdminAddRoute as never,
  "/dashboard": DashboardRoute as never,
  "/profile": ProfileRoute as never,
  "/settings": SettingsRoute as never,
  "/students": StudentsRoute as never,
  "/notes": NotesRoute as never,
};

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const path = usePathname();
  // Public profile: /u/:roll
  if (path.startsWith("/u/")) {
    const Comp = (PublicProfileRoute as { component: () => ReactElement }).component;
    return <Comp />;
  }
  const match = routes[path];
  if (!match) return <NotFound />;
  const Component = (match as { component: () => ReactElement }).component;
  return <Component />;
}