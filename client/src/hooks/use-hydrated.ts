import { useEffect, useState } from "react";

/** true only after the first client render — gates browser-computed UI. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
