import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { LiveClock, COMMON_TIMEZONES } from "@/components/clock/live-clock";
import { useClockPrefs } from "@/hooks/use-clock-prefs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Globe, Clock, Check } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings/timezone")({
  head: () =>
    pageHead({
      title: "Timezone & Clock Preferences — AapnaCronJob Console",
      description: "Manage system time, 12/24 hour display, and IANA timezone defaults.",
    }),
  component: SettingsTimezonePage,
});

export function SettingsTimezonePage() {
  const { prefs, setTimeZone, setHour12 } = useClockPrefs();

  const activeZone = prefs?.timeZone || "UTC";
  const hour12 = prefs?.hour12 ?? false;

  return (
    <AppShell
      breadcrumbs={[
        { label: "Settings", to: "/app/settings" },
        { label: "Timezone & Clock" },
      ]}
    >
      <div className="space-y-6 max-w-4xl">
        <div className="border-b border-border/80 pb-6">
          <span className="eyebrow block mb-1">Time Configuration</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Timezone & Clock Preferences
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
            Configure how timestamps, scheduling timelines, and the header clock render across the platform.
          </p>
        </div>

        {/* Sub-nav tabs */}
        <div className="flex items-center gap-3 border-b border-border text-xs font-mono">
          <Link
            to="/app/settings"
            className="pb-2 px-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          >
            General
          </Link>
          <Link
            to="/app/settings/timezone"
            className="pb-2 px-3 border-b-2 border-foreground text-foreground font-semibold"
          >
            Timezone & Clock
          </Link>
          <Link
            to="/app/settings/security"
            className="pb-2 px-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          >
            Security & Authentication
          </Link>
        </div>

        {/* Live Running Reference Clock Preview */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <span className="eyebrow block">Live Synchronized Reference Clock</span>
          <LiveClock variant="hero" />
        </div>

        {/* Settings Form */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-2">
              Default Display Timezone
            </label>
            <select
              value={activeZone}
              onChange={(e) => {
                setTimeZone(e.target.value);
                toast.success(`Display timezone set to ${e.target.value}`);
              }}
              className="w-full max-w-md h-9 rounded-md border border-border bg-background px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-cobalt"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-muted-foreground mt-1.5 block font-sans">
              Individual scheduled jobs can still be set to independent timezones.
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <div>
              <span className="font-semibold text-xs text-foreground block">
                Use 12-Hour Format (AM / PM)
              </span>
              <span className="text-[11px] text-muted-foreground font-sans">
                When disabled, all clocks and execution logs default to 24-hour military notation.
              </span>
            </div>
            <Switch
              checked={hour12}
              onCheckedChange={(val) => {
                setHour12(val);
                toast.info(`Clock format changed to ${val ? "12h" : "24h"}`);
              }}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
