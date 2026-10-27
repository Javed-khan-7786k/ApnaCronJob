import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataStore } from "@/lib/data-store";
import type { Job } from "@/types";
import { getNextRuns, humanizeCron } from "@/lib/cron";
import { formatInZone } from "@/lib/format";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Play } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/app/calendar")({
  head: () =>
    pageHead({
      title: "Schedule Calendar — AapnaCronJob Console",
      description: "Visual calendar schedule for all upcoming recurring jobs.",
    }),
  component: CalendarPage,
});

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString("en-US", { month: "long" });

  // Calculate actual days in this month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const [selectedDay, setSelectedDay] = useState(() => Math.min(new Date().getDate(), daysInMonth));
  const [jobs, setJobs] = useState<Job[]>(() => DataStore.getJobs());

  useEffect(() => {
    DataStore.syncWithBackend().then((ok) => {
      if (ok) setJobs(DataStore.getJobs());
    });
  }, []);

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(1);
  };

  // Compute scheduled runs specifically for selected calendar day
  const runsForDay = useMemo(() => {
    const targetStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay,
      0,
      0,
      0,
    );
    const targetEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay,
      23,
      59,
      59,
    );

    const matches = jobs
      .map((j) => {
        const runs = getNextRuns(j.cron, { count: 8, fromDate: targetStart }).filter(
          (r) => r >= targetStart && r <= targetEnd,
        );
        return {
          job: j,
          runs,
        };
      })
      .filter((item) => item.runs.length > 0);

    // If no jobs run on this specific day, show next upcoming runs
    if (matches.length === 0) {
      return jobs.map((j) => ({
        job: j,
        runs: getNextRuns(j.cron, { count: 2, fromDate: targetStart }),
      }));
    }

    return matches;
  }, [jobs, currentDate, selectedDay]);

  return (
    <AppShell breadcrumbs={[{ label: "Schedule Calendar" }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow block mb-1">Timeline Planning</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Scheduling Calendar
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
              Visualize recurring execution densities and plan maintenance windows.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-muted-foreground">
              {currentMonth} {currentYear}
            </span>
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Previous Month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Next Month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Days grid */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Select Day of Month</span>
            <span className="text-xs font-mono text-muted-foreground">
              {currentMonth} {selectedDay}, {currentYear}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d} className="text-muted-foreground uppercase text-[10px] pb-1">
                {d}
              </span>
            ))}
            {days.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={`py-2 rounded-lg border transition-all ${
                  selectedDay === d
                    ? "border-cobalt bg-cobalt text-white font-bold"
                    : "border-border/60 hover:bg-muted/40 text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Runs scheduled for selected day */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cobalt" />
              <h2 className="font-display font-bold text-base text-foreground">
                Scheduled Runs on {currentMonth} {selectedDay}
              </h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {jobs.length} active monitors
            </span>
          </div>

          <div className="space-y-3">
            {runsForDay.map(({ job, runs }) => (
              <div
                key={job.id}
                className="p-3.5 rounded-lg border border-border/80 bg-paper-sunken/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/app/jobs/$jobId"
                      params={{ jobId: job.id }}
                      className="font-bold text-foreground hover:underline"
                    >
                      {job.name}
                    </Link>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {job.method}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-sans mt-0.5 block">
                    {humanizeCron(job.cron)} • {job.url}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-semibold text-foreground block">
                      {runs[0] ? formatInZone(runs[0], "UTC") : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">UTC Reference</span>
                  </div>

                  <Link to="/app/jobs/$jobId" params={{ jobId: job.id }}>
                    <Button variant="outline" size="sm" className="h-7 text-xs font-mono">
                      Inspect
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
