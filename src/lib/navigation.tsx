import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type NavigateInput = string | { to: string };

type NavigationContextValue = {
  path: string;
  navigate: (input: NavigateInput) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

const normalize = (to: string) => (to.startsWith("/") ? to : `/${to}`);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(() => (typeof window === "undefined" ? "/" : window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const value = useMemo<NavigationContextValue>(() => ({
    path,
    navigate(input) {
      const to = normalize(typeof input === "string" ? input : input.to);
      if (to !== window.location.pathname) window.history.pushState({}, "", to);
      setPath(to);
      window.scrollTo({ top: 0, behavior: "instant" });
    },
  }), [path]);

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigate() {
  return useContext(NavigationContext)?.navigate ?? (() => {});
}

export function usePathname() {
  return useContext(NavigationContext)?.path ?? "/";
}

/**
 * Returns the trailing segment(s) of the path after the given prefix.
 * Example: pattern "/u/" on path "/u/2426006" -> "2426006".
 */
export function useParam(prefix: string): string {
  const path = usePathname();
  if (!path.startsWith(prefix)) return "";
  return decodeURIComponent(path.slice(prefix.length));
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    navigate,
    invalidate: () => undefined,
    subscribe: () => () => undefined,
  };
}

export function Link({
  to,
  className,
  activeProps,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  activeProps?: { className?: string };
}) {
  const nav = useContext(NavigationContext);
  const href = normalize(to);
  const active = nav?.path === href;
  return (
    <a
      {...props}
      href={href}
      className={active && activeProps?.className ? activeProps.className : className}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        nav?.navigate(href);
      }}
    >
      {children}
    </a>
  );
}

export function Navigate({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to), [navigate, to]);
  return null;
}

export function createFileRoute(_path: string) {
  return <T extends object>(config: T) => config;
}