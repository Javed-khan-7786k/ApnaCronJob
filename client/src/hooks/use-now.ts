import { useEffect, useState } from "react";

/**
 * Ticking "now", updating every `stepMs`. Returns null until mounted so SSR
 * and first client render stay identical (no hydration drift).
 */
export function useNow(stepMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), stepMs);

    const onVisible = () => {
      // Re-sync after the tab slept; avoids time drift from throttled timers.
      if (document.visibilityState === "visible") setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [stepMs]);

  return now;
}
