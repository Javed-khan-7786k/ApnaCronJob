import { useState, useMemo } from "react";
import {
  validateCron,
  humanizeCron,
  getNextRuns,
  CRON_PRESETS,
} from "@/lib/cron";
import { formatInZone, shortFutureLabel } from "@/lib/format";
import { COMMON_TIMEZONES } from "@/components/clock/live-clock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Sliders,
  HelpCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface CronEditorProps {
  value: string;
  onChange: (value: string) => void;
  timezone?: string;
  onTimezoneChange?: (tz: string) => void;
  showTimezoneSelect?: boolean;
  className?: string;
}

export function CronEditor({
  value,
  onChange,
  timezone = "UTC",
  onTimezoneChange,
  showTimezoneSelect = true,
  className = "",
}: CronEditorProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "builder" | "raw">("presets");

  // Validate the expression
  const validation = useMemo(() => validateCron(value), [value]);
  const explanation = useMemo(() => humanizeCron(value), [value]);

  // Compute next 5 runs
  const nextRuns = useMemo(() => {
    if (!validation.ok) return [];
    return getNextRuns(value, { count: 5, timeZone: timezone });
  }, [value, validation, timezone]);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      toast.success("Cron expression copied to clipboard!");
    }
  };

  // Helper for builder fields
  const fields = useMemo(() => {
    const parts = value.trim().split(/\s+/);
    return {
      minute: parts[0] || "*",
      hour: parts[1] || "*",
      dom: parts[2] || "*",
      month: parts[3] || "*",
      dow: parts[4] || "*",
    };
  }, [value]);

  const updateField = (index: number, val: string) => {
    const parts = value.trim().split(/\s+/);
    while (parts.length < 5) parts.push("*");
    parts[index] = val.trim() || "*";
    onChange(parts.slice(0, 5).join(" "));
  };

  return (
    <div className={`space-y-4 rounded-xl border border-border bg-card p-5 ${className}`}>
      {/* Header with mode switcher and copy */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={activeTab === "presets" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("presets")}
            className="text-xs h-7"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Presets
          </Button>
          <Button
            type="button"
            variant={activeTab === "builder" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("builder")}
            className="text-xs h-7"
          >
            <Sliders className="h-3 w-3 mr-1" />
            Visual Builder
          </Button>
          <Button
            type="button"
            variant={activeTab === "raw" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("raw")}
            className="text-xs h-7"
          >
            Raw Expression
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {showTimezoneSelect && onTimezoneChange && (
            <select
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="h-7 text-xs rounded border border-border bg-background px-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-cobalt"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.value}
                </option>
              ))}
            </select>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            title="Copy cron expression"
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
        </div>
      </div>

      {/* Tab: Presets */}
      {activeTab === "presets" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {CRON_PRESETS.map((p) => {
            const isSelected = value.trim() === p.expr;
            return (
              <button
                key={p.expr}
                type="button"
                onClick={() => onChange(p.expr)}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? "border-cobalt bg-cobalt/5 text-foreground ring-1 ring-cobalt"
                    : "border-border/80 hover:border-foreground/40 bg-background/50 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-foreground">{p.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-cobalt" />}
                </div>
                <code className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {p.expr}
                </code>
                <span className="mt-1 text-[10px] text-muted-foreground/80 truncate">
                  {p.hint}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab: Visual Builder */}
      {activeTab === "builder" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase text-muted-foreground block mb-1">
                Minute (0-59)
              </label>
              <Input
                value={fields.minute}
                onChange={(e) => updateField(0, e.target.value)}
                placeholder="*"
                className="font-mono text-center text-sm"
              />
              <span className="text-[10px] text-muted-foreground block mt-1 text-center">
                e.g. *, */5, 0,30
              </span>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted-foreground block mb-1">
                Hour (0-23)
              </label>
              <Input
                value={fields.hour}
                onChange={(e) => updateField(1, e.target.value)}
                placeholder="*"
                className="font-mono text-center text-sm"
              />
              <span className="text-[10px] text-muted-foreground block mt-1 text-center">
                e.g. *, 9, 0-23
              </span>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted-foreground block mb-1">
                Day of Month (1-31)
              </label>
              <Input
                value={fields.dom}
                onChange={(e) => updateField(2, e.target.value)}
                placeholder="*"
                className="font-mono text-center text-sm"
              />
              <span className="text-[10px] text-muted-foreground block mt-1 text-center">
                e.g. *, 1, 15
              </span>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-muted-foreground block mb-1">
                Month (1-12)
              </label>
              <Input
                value={fields.month}
                onChange={(e) => updateField(3, e.target.value)}
                placeholder="*"
                className="font-mono text-center text-sm"
              />
              <span className="text-[10px] text-muted-foreground block mt-1 text-center">
                e.g. *, 1-12
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] font-mono uppercase text-muted-foreground block mb-1">
                Day of Week (0-6)
              </label>
              <Input
                value={fields.dow}
                onChange={(e) => updateField(4, e.target.value)}
                placeholder="*"
                className="font-mono text-center text-sm"
              />
              <span className="text-[10px] text-muted-foreground block mt-1 text-center">
                e.g. *, 1-5 (Mon-Fri)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary Expression Display & Input */}
      <div className="rounded-lg border border-border/80 bg-paper-sunken p-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1">
            <span className="eyebrow block mb-1">Active Cron Expression</span>
            <div className="flex items-center gap-2">
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="* * * * *"
                className="font-mono text-base font-semibold tracking-wider text-foreground bg-background max-w-sm"
              />
              {validation.ok ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px]">
                  Valid Syntax
                </Badge>
              ) : (
                <Badge variant="destructive" className="font-mono text-[11px]">
                  Invalid Syntax
                </Badge>
              )}
            </div>
          </div>

          <div className="sm:border-l sm:border-border/60 sm:pl-4 flex-1">
            <span className="eyebrow block mb-1">Human Translation</span>
            <div className="flex items-start gap-1.5 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-cobalt shrink-0 mt-0.5" />
              <span>{explanation}</span>
            </div>
            {!validation.ok && (
              <div className="mt-1 flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{validation.error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Executions Preview */}
      {validation.ok && nextRuns.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-background/50 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="eyebrow flex items-center gap-1">
              <Calendar className="h-3 w-3 text-cobalt" />
              Upcoming Scheduled Executions ({timezone})
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Calculated client-side
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {nextRuns.map((date, idx) => {
              const diffMs = date.getTime() - Date.now();
              return (
                <div
                  key={idx}
                  className="rounded border border-border/60 bg-card p-2 text-center"
                >
                  <span className="block font-mono text-xs font-semibold text-foreground">
                    {formatInZone(date, timezone)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                    {shortFutureLabel(diffMs)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
