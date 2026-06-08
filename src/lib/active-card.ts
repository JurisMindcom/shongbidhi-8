import { useEffect, useReducer } from "react";

let active: string | null = null;
const subs = new Set<() => void>();

export function setActiveCard(id: string | null) {
  active = id;
  subs.forEach((s) => s());
}

export function useActiveCard() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    const f = () => force();
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  return { activeId: active, setActiveCard };
}