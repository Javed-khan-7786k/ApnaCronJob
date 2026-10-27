import { CronExpressionParser } from "cron-parser";

export type CronValidation = { ok: true } | { ok: false; error: string };

/** Validate a 5-field cron expression. */
export function validateCron(expr: string): CronValidation {
  const trimmed = expr.trim();
  if (!trimmed) return { ok: false, error: "Enter a cron expression." };
  try {
    CronExpressionParser.parse(trimmed, { currentDate: new Date() });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid cron expression.",
    };
  }
}

/** Compute the next run dates. Returns [] when the expression is invalid. */
export function getNextRuns(
  expr: string,
  opts: { count?: number; timeZone?: string; fromDate?: Date } = {},
): Date[] {
  const out: Date[] = [];
  try {
    const parsed = CronExpressionParser.parse(expr.trim(), {
      currentDate: opts.fromDate ?? new Date(),
      tz: opts.timeZone,
    });
    for (let i = 0; i < (opts.count ?? 5); i++) {
      out.push(parsed.next().toDate());
    }
  } catch {
    // invalid expression — caller renders validation state instead
  }
  return out;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

type Fields = { minute: string; hour: string; dom: string; month: string; dow: string };

function splitFields(expr: string): Fields | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return { minute: parts[0], hour: parts[1], dom: parts[2], month: parts[3], dow: parts[4] };
}

function isEvery(field: string) {
  return field === "*" || field === "0" && false;
}

function describeList(field: string, names: string[]): string | null {
  if (field === "*") return null;
  const nums = field.split(",").map((n) => Number(n));
  if (nums.some((n) => !Number.isInteger(n))) return null;
  if (nums.length === 1) return names[nums[0]] ?? String(nums[0]);
  const labels = nums.map((n) => names[n] ?? String(n));
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function describeDow(field: string): string {
  if (field === "*") return "";
  if (field === "1-5") return " on weekdays";
  if (field === "0,6" || field === "6,0") return " on weekends";
  const range = field.match(/^(\d+)-(\d+)$/);
  if (range) {
    const a = DAY_NAMES[Number(range[1]) % 7];
    const b = DAY_NAMES[Number(range[2]) % 7];
    if (a && b) return ` from ${a} to ${b}`;
  }
  const step = field.match(/^\*\/(\d+)$/);
  if (step) return ` every ${step[1]} days of the week`;
  const list = describeList(field, DAY_NAMES);
  if (list) return ` on ${list}`;
  return ` on day-of-week “${field}”`;
}

function describeMonth(field: string): string {
  if (field === "*") return "";
  const list = describeList(field, MONTH_NAMES);
  if (list) return ` in ${list}`;
  return ` in month “${field}”`;
}

function describeDom(field: string): string {
  if (field === "*") return "";
  if (/^\*\/(\d+)$/.test(field)) {
    return ` every ${field.match(/^\*\/(\d+)$/)![1]} days of the month`;
  }
  const list = describeList(field, []);
  if (list) return ` on day ${list} of the month`;
  return ` on day-of-month “${field}”`;
}

/**
 * Translate a cron expression into plain English. Covers the common shapes
 * (every N minutes, hourly, daily at time, weekday ranges, monthly) and falls
 * back to a readable restatement rather than failing.
 */
export function humanizeCron(expr: string): string {
  const fields = splitFields(expr);
  if (!fields) return `Runs on schedule “${expr.trim()}”`;
  const { minute, hour, dom, month, dow } = fields;

  const dowText = describeDow(dow);
  const domText = describeDom(dom);
  const monthText = describeMonth(month);
  const dayText = `${domText}${dowText}${monthText}`.trim();

  const minNum = Number(minute);
  const hourNum = Number(hour);
  const minuteStep = minute.match(/^\*\/(\d+)$/);
  const hourStep = hour.match(/^\*\/(\d+)$/);
  const hourRangeList = hour.match(/^(\d+)-(\d+)$/);

  // "every N minutes"
  if (minuteStep && hour === "*") {
    const n = minuteStep[1];
    return `Every ${n} minutes${dayText ? `, ${dayText}` : ""}`;
  }
  // "at minutes M,N of every hour"
  if (hour === "*" && /^[\d,]+$/.test(minute)) {
    if (minute === "*") return "Every minute";
    const mins = minute.split(",").join(", ");
    return `At minute ${mins} past every hour${dayText ? `, ${dayText}` : ""}`;
  }
  // "every N hours at minute M"
  if (hourStep && !Number.isNaN(minNum)) {
    return `At minute ${minute} past every ${hourStep[1]} hours${dayText ? `, ${dayText}` : ""}`;
  }
  // "hourly range 9-17 at minute M"
  if (hourRangeList && !Number.isNaN(minNum)) {
    return `At minute ${minute} past every hour from ${hourRangeList[1]}:00 to ${hourRangeList[2]}:00${dayText ? `, ${dayText}` : ""}`;
  }
  // fixed daily time(s): "30 8,18 * * *"
  if (!Number.isNaN(hourNum) && !Number.isNaN(minNum) && /^[\d,]+$/.test(hour)) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const times = hour.split(",").map((h) => `${pad(Number(h))}:${pad(minNum)}`).join(", ");
    const domNote = dom === "*" ? "" : ` on day ${dom} of the month`;
    const monthNote = month === "*" ? "" : ` in ${describeList(month, MONTH_NAMES) ?? month}`;
    if (dow === "*") {
      if (dom === "*" && month === "*") return `Every day at ${times}`;
      return `At ${times}${domNote}${monthNote}`;
    }
    const dowList = describeList(dow, DAY_NAMES);
    return `At ${times} on ${dowList ?? dow}`;
  }
  // list of minutes with fixed hour handled above; remaining custom shapes:
  if (isEvery(minute) && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return "Every minute";
  }
  return `Custom schedule “${expr.trim()}”`;
}

export type CronPreset = { label: string; expr: string; hint: string };

export const CRON_PRESETS: CronPreset[] = [
  { label: "Every minute", expr: "* * * * *", hint: "High-frequency pings and heartbeats" },
  { label: "Every 5 minutes", expr: "*/5 * * * *", hint: "Frequent polling" },
  { label: "Every 15 minutes", expr: "*/15 * * * *", hint: "Quarter-hour checks" },
  { label: "Every hour", expr: "0 * * * *", hint: "Top of every hour" },
  { label: "Every 6 hours", expr: "0 */6 * * *", hint: "Four times a day" },
  { label: "Daily at 09:00", expr: "0 9 * * *", hint: "Morning reports" },
  { label: "Daily at 02:00", expr: "0 2 * * *", hint: "Nightly maintenance" },
  { label: "Weekdays at 08:30", expr: "30 8 * * 1-5", hint: "Monday to Friday" },
  { label: "Mondays at 12:00", expr: "0 12 * * 1", hint: "Weekly digest" },
  { label: "First of the month", expr: "0 0 1 * *", hint: "Monthly cleanup" },
];
