import { useEffect, useState } from "react";

export interface ClockPrefs {
  timeZone: string;
  hour12: boolean;
}

const TZ_KEY = "aapnacronjob-clock-timezone";
const FORMAT_KEY = "aapnacronjob-clock-hour12";

/** Clock preferences persisted to localStorage; defaults to the browser zone. */
export function useClockPrefs(): {
  prefs: ClockPrefs | null;
  setTimeZone: (tz: string) => void;
  setHour12: (hour12: boolean) => void;
} {
  const [prefs, setPrefs] = useState<ClockPrefs | null>(null);

  useEffect(() => {
    let timeZone = "UTC";
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      // keep UTC
    }
    let hour12 = false;
    try {
      hour12 = window.localStorage.getItem(FORMAT_KEY) === "true";
      const stored = window.localStorage.getItem(TZ_KEY);
      if (stored) timeZone = stored;
    } catch {
      // defaults fine
    }
    setPrefs({ timeZone, hour12 });
  }, []);

  return {
    prefs,
    setTimeZone: (timeZone) =>
      setPrefs((p) => {
        try {
          window.localStorage.setItem(TZ_KEY, timeZone);
        } catch {
          // ignore
        }
        return p ? { ...p, timeZone } : { timeZone, hour12: false };
      }),
    setHour12: (hour12) =>
      setPrefs((p) => {
        try {
          window.localStorage.setItem(FORMAT_KEY, String(hour12));
        } catch {
          // ignore
        }
        return p ? { ...p, hour12 } : { timeZone: "UTC", hour12 };
      }),
  };
}
