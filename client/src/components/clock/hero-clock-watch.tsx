import { useEffect, useState, useRef, useMemo } from "react";
import { useClockPrefs } from "@/hooks/use-clock-prefs";
import { utcOffsetLabel, timezoneAbbrev } from "@/lib/format";

export function HeroClockWatch({ className = "" }: { className?: string }) {
  const [time, setTime] = useState<Date>(() => new Date());
  const { prefs } = useClockPrefs();
  const activeZone = prefs?.timeZone || "UTC";

  // Use requestAnimationFrame for smooth sweeping second hand
  useEffect(() => {
    let animId: number;
    const update = () => {
      setTime(new Date());
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setTime(new Date());
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Compute angles based on timezone
  const {
    hoursAngle,
    minutesAngle,
    secondsAngle,
    millisAngle,
    digitalTime,
    digitalDate,
    utcTime,
    offset,
    abbrev,
  } = useMemo(() => {
    const targetDate = time;
    try {
      // Calculate time in selected timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: activeZone,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        fractionalSecondDigits: 3,
        hour12: false,
      });
      const parts = formatter.formatToParts(time);
      const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
      const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
      const s = Number(parts.find((p) => p.type === "second")?.value || 0);
      const ms = time.getMilliseconds();

      const secFraction = s + ms / 1000;
      const minFraction = m + secFraction / 60;
      const hourFraction = (h % 12) + minFraction / 60;

      const sAngle = secFraction * 6; // 360 / 60 = 6 deg
      const mAngle = minFraction * 6; // 360 / 60 = 6 deg
      const hAngle = hourFraction * 30; // 360 / 12 = 30 deg
      const msAngle = (ms / 1000) * 360;

      const dateStr = new Intl.DateTimeFormat("en-US", {
        timeZone: activeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(time);

      const digital = new Intl.DateTimeFormat("en-US", {
        timeZone: activeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(time);

      const utcStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(time);

      return {
        hoursAngle: hAngle,
        minutesAngle: mAngle,
        secondsAngle: sAngle,
        millisAngle: msAngle,
        digitalTime: digital,
        digitalDate: dateStr,
        utcTime: utcStr,
        offset: utcOffsetLabel(activeZone, time),
        abbrev: timezoneAbbrev(activeZone, time),
      };
    } catch {
      return {
        hoursAngle: 0,
        minutesAngle: 0,
        secondsAngle: 0,
        millisAngle: 0,
        digitalTime: "--:--:--",
        digitalDate: "",
        utcTime: "--:--:--",
        offset: "UTC",
        abbrev: "UTC",
      };
    }
  }, [time, activeZone]);

  // Generate 60 tick marks for the watch face
  const ticks = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const isMajor = i % 5 === 0;
      const angle = i * 6;
      return { index: i, isMajor, angle };
    });
  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Outer ambient glow */}
      <div className="absolute -inset-4 rounded-full bg-cobalt/15 blur-2xl pointer-events-none" />

      {/* Main Watch Case */}
      <div className="relative w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 rounded-full p-2 bg-gradient-to-b from-border/90 via-card to-border/70 shadow-2xl hairline">
        {/* Watch Bezel with brushed metallic texture */}
        <div className="relative w-full h-full rounded-full p-3 bg-gradient-to-tr from-card via-background to-card shadow-inner border border-border/80">
          {/* Dial Face */}
          <div className="relative w-full h-full rounded-full bg-paper-sunken/90 border border-border/60 shadow-inner overflow-hidden flex items-center justify-center">
            {/* Subtle radial dial pattern */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--color-cobalt-soft)_0%,_transparent_70%)]" />

            {/* 60 Minute / Second Ticks */}
            {ticks.map((tick) => (
              <div
                key={tick.index}
                className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom flex flex-col items-center"
                style={{
                  height: "50%",
                  transform: `rotate(${tick.angle}deg)`,
                }}
              >
                <div
                  className={`rounded-full transition-colors ${
                    tick.isMajor ? "w-1 h-3.5 bg-foreground" : "w-0.5 h-1.5 bg-muted-foreground/40"
                  }`}
                />
              </div>
            ))}

            {/* Hour Numbers (12, 3, 6, 9) */}
            <span className="absolute top-4 font-display font-extrabold text-xs sm:text-sm text-foreground tracking-wider">
              12
            </span>
            <span className="absolute right-4 font-display font-extrabold text-xs sm:text-sm text-foreground tracking-wider">
              3
            </span>
            <span className="absolute bottom-4 font-display font-extrabold text-xs sm:text-sm text-foreground tracking-wider">
              6
            </span>
            <span className="absolute left-4 font-display font-extrabold text-xs sm:text-sm text-foreground tracking-wider">
              9
            </span>

            {/* Brand Logo on Dial */}
            <div className="absolute top-14 sm:top-18 flex flex-col items-center text-center">
              <span className="font-display font-black tracking-widest text-xs sm:text-sm text-foreground uppercase">
                AAPNACRONJOB
              </span>
              <span className="font-mono text-[8px] sm:text-[9px] tracking-widest text-cobalt uppercase font-bold mt-0.5">
                PRECISION CHRONOMETER
              </span>
            </div>

            {/* Sub-Dial 1: UTC / 24-Hour */}
            <div className="absolute left-10 sm:left-14 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-border/80 bg-background/50 flex flex-col items-center justify-center shadow-xs">
              <span className="text-[7px] font-mono uppercase text-muted-foreground tracking-wider">
                UTC
              </span>
              <span className="text-[9px] font-mono font-bold text-foreground">
                {utcTime.slice(0, 5)}
              </span>
            </div>

            {/* Sub-Dial 2: Millisecond / Sweep Rate */}
            <div className="absolute right-10 sm:right-14 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-border/80 bg-background/50 flex flex-col items-center justify-center shadow-xs">
              <span className="text-[7px] font-mono uppercase text-muted-foreground tracking-wider">
                OFFSET
              </span>
              <span className="text-[9px] font-mono font-bold text-cobalt">{offset}</span>
            </div>

            {/* Date Window at 4:30 */}
            <div className="absolute bottom-16 sm:bottom-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-border/80 bg-background/80 shadow-xs font-mono text-[10px] sm:text-xs">
              <span className="font-semibold text-foreground uppercase">{digitalDate}</span>
            </div>

            {/* Hands Layer */}
            {/* 1. Hour Hand */}
            <div
              className="absolute w-2 rounded-full bg-foreground origin-bottom shadow-md z-10"
              style={{
                height: "26%",
                bottom: "50%",
                left: "calc(50% - 4px)",
                transform: `rotate(${hoursAngle}deg)`,
                transition: "transform 0.05s linear",
              }}
            >
              <div className="mx-auto w-1 h-3/5 mt-1 bg-background/60 rounded-full" />
            </div>

            {/* 2. Minute Hand */}
            <div
              className="absolute w-1.5 rounded-full bg-foreground origin-bottom shadow-lg z-20"
              style={{
                height: "38%",
                bottom: "50%",
                left: "calc(50% - 3px)",
                transform: `rotate(${minutesAngle}deg)`,
                transition: "transform 0.05s linear",
              }}
            >
              <div className="mx-auto w-0.5 h-3/4 mt-1 bg-cobalt rounded-full" />
            </div>

            {/* 3. Second Hand (Electric Cobalt needle with counterbalance) */}
            <div
              className="absolute w-0.5 bg-cobalt origin-bottom z-30 shadow-sm"
              style={{
                height: "45%",
                bottom: "50%",
                left: "calc(50% - 1px)",
                transform: `rotate(${secondsAngle}deg)`,
              }}
            >
              {/* Counter-weight below center */}
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-1.5 h-4 bg-cobalt rounded-b-full">
                <div className="w-3 h-3 -ml-0.75 mt-1 rounded-full border border-cobalt bg-background" />
              </div>
            </div>

            {/* Center Pinion / Cap */}
            <div className="absolute z-40 w-3.5 h-3.5 rounded-full bg-cobalt border-2 border-background shadow-md flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Digital Precision Telemetry below watch */}
      <div className="mt-4 flex flex-col items-center space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 font-mono text-xs shadow-xs backdrop-blur-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold text-foreground tracking-widest text-sm">{digitalTime}</span>
          <span className="text-[10px] text-cobalt font-semibold">{abbrev}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/80">
          Continuous 60 FPS Atomic Quartz Movement • Sync Guard Active
        </span>
      </div>
    </div>
  );
}
