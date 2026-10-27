import { useState, useMemo } from "react";
import { Clock as ClockIcon, Globe, Check, ChevronsUpDown } from "lucide-react";
import { useNow } from "@/hooks/use-now";
import { useClockPrefs } from "@/hooks/use-clock-prefs";
import { timezoneAbbrev, utcOffsetLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "New York (EST/EDT, UTC-5/-4)" },
  { value: "America/Chicago", label: "Chicago (CST/CDT, UTC-6/-5)" },
  { value: "America/Denver", label: "Denver (MST/MDT, UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT, UTC-8/-7)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT, UTC-3)" },
  { value: "Europe/London", label: "London (GMT/BST, UTC+0/+1)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST, UTC+1/+2)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST, UTC+1/+2)" },
  { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
  { value: "Asia/Kolkata", label: "Kolkata (IST, UTC+5:30)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT, UTC+10/+11)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT, UTC+12/+13)" },
];

export interface LiveClockProps {
  variant?: "hero" | "header" | "card" | "compact";
  showUtcReference?: boolean;
  className?: string;
}

export function LiveClock({
  variant = "hero",
  showUtcReference = true,
  className = "",
}: LiveClockProps) {
  const now = useNow(1000);
  const { prefs, setTimeZone, setHour12 } = useClockPrefs();
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeZone = prefs?.timeZone || "UTC";
  const hour12 = prefs?.hour12 ?? false;

  const formattedTime = useMemo(() => {
    if (!now) return { time: "--:--:--", date: "Loading...", utcTime: "--:--:--" };

    try {
      const timeFmt = new Intl.DateTimeFormat("en-US", {
        timeZone: activeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12,
      }).format(now);

      const dateFmt = new Intl.DateTimeFormat("en-US", {
        timeZone: activeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(now);

      const utcFmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);

      return { time: timeFmt, date: dateFmt, utcTime: utcFmt };
    } catch {
      return { time: "--:--:--", date: "Invalid Timezone", utcTime: "--:--:--" };
    }
  }, [now, activeZone, hour12]);

  const offset = useMemo(() => {
    if (!now) return "UTC";
    return utcOffsetLabel(activeZone, now);
  }, [now, activeZone]);

  const abbr = useMemo(() => {
    if (!now) return "UTC";
    return timezoneAbbrev(activeZone, now);
  }, [now, activeZone]);

  // Popover selector for timezone
  const tzSelector = (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded border border-border/80 bg-background/60 px-2 py-0.5 text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Change clock timezone"
        >
          <Globe className="h-3 w-3 text-cobalt" />
          <span>{activeZone.split("/").pop()?.replace("_", " ") ?? activeZone}</span>
          <span className="text-[10px] opacity-70">({offset})</span>
          <ChevronsUpDown className="h-2.5 w-2.5 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup heading="Standard Timezones">
              {COMMON_TIMEZONES.map((tz) => (
                <CommandItem
                  key={tz.value}
                  value={tz.label}
                  onSelect={() => {
                    setTimeZone(tz.value);
                    setPickerOpen(false);
                  }}
                  className="flex items-center justify-between text-xs font-mono"
                >
                  <span className="truncate">{tz.label}</span>
                  {activeZone === tz.value && (
                    <Check className="h-3.5 w-3.5 text-cobalt shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  // Compact header variant
  if (variant === "header") {
    return (
      <div
        className={`flex items-center gap-2 text-xs font-mono text-muted-foreground ${className}`}
        aria-label="Application header clock"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-foreground tracking-wider">
          {formattedTime.time}
        </span>
        <span className="text-[11px] text-muted-foreground/80">{abbr}</span>
        {tzSelector}
      </div>
    );
  }

  // Compact badge variant
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 text-xs font-mono ${className}`}>
        <ClockIcon className="h-3.5 w-3.5 text-cobalt" />
        <span className="font-semibold text-foreground">{formattedTime.time}</span>
        <span className="text-muted-foreground">[{offset}]</span>
      </div>
    );
  }

  // Card variant for dashboard
  if (variant === "card") {
    return (
      <div
        className={`rounded-lg border border-border bg-card p-4 transition-colors ${className}`}
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cobalt opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cobalt" />
            </span>
            <span className="eyebrow">Synchronized Clock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setHour12(!hour12)}
              className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              {hour12 ? "12h" : "24h"}
            </button>
            {tzSelector}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
            {formattedTime.time}
          </span>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{formattedTime.date}</span>
            {showUtcReference && activeZone !== "UTC" && (
              <span className="font-mono text-[11px] opacity-80">
                UTC: {formattedTime.utcTime}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Large Hero Editorial Variant (for Landing Hero & dedicated sections)
  return (
    <div
      className={`relative inline-block rounded-xl border border-border bg-card/90 p-5 backdrop-blur-xs transition-all hairline ${className}`}
      aria-label="Live running system clock"
    >
      <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="eyebrow tracking-widest text-foreground font-semibold">
            Live Atomic Reference Clock
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHour12(!hour12)}
            className="rounded border border-border bg-background px-2 py-0.5 text-[11px] font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Toggle 12/24 hour display"
          >
            {hour12 ? "12-HOUR" : "24-HOUR"}
          </button>
          {tzSelector}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-baseline">
        <div>
          <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground flex items-baseline gap-1">
            <span>{formattedTime.time}</span>
            <span className="text-sm font-medium text-cobalt ml-1">{abbr}</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground font-sans">
            {formattedTime.date}
          </p>
        </div>

        {showUtcReference && (
          <div className="md:border-l md:border-border/60 md:pl-4 flex flex-col justify-end text-xs font-mono text-muted-foreground">
            <div className="flex items-center justify-between py-0.5">
              <span>Universal UTC:</span>
              <span className="font-semibold text-foreground">{formattedTime.utcTime}</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span>Offset:</span>
              <span>{offset}</span>
            </div>
            <div className="flex items-center justify-between py-0.5 text-[10px] text-muted-foreground/80">
              <span>Drift Guard:</span>
              <span className="text-emerald-600 dark:text-emerald-400">Tab-synced</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Informational reference clock. Not a backend confirmation.</span>
        <span className="text-cobalt">cron-parser 5.10</span>
      </div>
    </div>
  );
}
