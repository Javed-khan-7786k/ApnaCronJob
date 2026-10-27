const SEC_IN_MIN = 60;
const SEC_IN_HOUR = 60 * SEC_IN_MIN;
const SEC_IN_DAY = 24 * SEC_IN_HOUR;

const MIN_IN_HOUR = 60;
const MIN_IN_DAY = 24 * MIN_IN_HOUR;

/** 73 → "1 hr ago", 0 → "Just now", 2880 → "2 d ago" */
export function relativeLabel(minutesAgo: number | null): string {
  if (minutesAgo == null) return "Never";
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < MIN_IN_HOUR) return `${Math.round(minutesAgo)} min ago`;
  if (minutesAgo < MIN_IN_DAY) return `${Math.round(minutesAgo / MIN_IN_HOUR)} hr ago`;
  return `${Math.round(minutesAgo / MIN_IN_DAY)} d ago`;
}

export function shortFutureLabel(msFromNow: number | null): string {
  if (msFromNow == null) return "—";
  const s = Math.round(msFromNow / 1000);
  if (s < 60) return `in ${s}s`;
  if (s < SEC_IN_HOUR) return `in ${Math.floor(s / SEC_IN_MIN)} min`;
  if (s < SEC_IN_DAY) return `in ${Math.floor(s / SEC_IN_HOUR)} hr`;
  return `in ${Math.floor(s / SEC_IN_DAY)} d`;
}

/** 12843 → "12.8s", 340000 → "5m 40s" */
export function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** Format a Date in a timezone, e.g. "Oct 27, 09:30" */
export function formatInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function timezoneAbbrev(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    const tz = parts.find((p) => p.type === "timeZoneName");
    return tz?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

export function utcOffsetLabel(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const tz = parts.find((p) => p.type === "timeZoneName");
    return tz?.value?.replace("GMT", "UTC") ?? timeZone;
  } catch {
    return timeZone;
  }
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
