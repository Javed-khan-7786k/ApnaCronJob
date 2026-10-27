import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { humanizeCron, validateCron } from "@/lib/cron";
import { formatDuration, relativeLabel } from "@/lib/format";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it("matches a page for / instead of falling back to not found", () => {
    const matches = router.matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches public routes correctly", () => {
    expect(router.matchRoutes("/pricing").at(-1)?.routeId).toBe("/pricing");
    expect(router.matchRoutes("/status").at(-1)?.routeId).toBe("/status");
    expect(router.matchRoutes("/docs").at(-1)?.routeId).toBe("/docs/");
    expect(router.matchRoutes("/features").at(-1)?.routeId).toBe("/features/");
  });

  it("matches console authenticated routes correctly", () => {
    expect(router.matchRoutes("/app").at(-1)?.routeId).toBe("/app/");
    expect(router.matchRoutes("/app/jobs").at(-1)?.routeId).toBe("/app/jobs/");
    expect(router.matchRoutes("/app/jobs/new").at(-1)?.routeId).toBe("/app/jobs/new");
    expect(router.matchRoutes("/app/calendar").at(-1)?.routeId).toBe("/app/calendar");
    expect(router.matchRoutes("/app/history").at(-1)?.routeId).toBe("/app/history");
  });
});

describe("Cron Parser & Humanizer", () => {
  it("validates valid cron expressions", () => {
    expect(validateCron("* * * * *").ok).toBe(true);
    expect(validateCron("0 2 * * *").ok).toBe(true);
    expect(validateCron("*/15 9-17 * * 1-5").ok).toBe(true);
  });

  it("rejects invalid expressions", () => {
    expect(validateCron("invalid").ok).toBe(false);
    expect(validateCron("").ok).toBe(false);
  });

  it("humanizes cron expressions cleanly", () => {
    expect(humanizeCron("* * * * *")).toBe("Every minute");
    expect(humanizeCron("*/5 * * * *")).toBe("Every 5 minutes");
    expect(humanizeCron("0 9 * * *")).toBe("Every day at 09:00");
  });
});

describe("Format Utilities", () => {
  it("formats durations accurately", () => {
    expect(formatDuration(250)).toBe("250 ms");
    expect(formatDuration(1500)).toBe("1.50s");
    expect(formatDuration(120000)).toBe("2m 0s");
  });

  it("formats relative labels", () => {
    expect(relativeLabel(null)).toBe("Never");
    expect(relativeLabel(0)).toBe("Just now");
    expect(relativeLabel(45)).toBe("45 min ago");
    expect(relativeLabel(120)).toBe("2 hr ago");
  });
});

