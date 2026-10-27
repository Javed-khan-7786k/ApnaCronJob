import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataStore } from "@/lib/data-store";
import type { AuditEntry } from "@/types";
import { relativeLabel } from "@/lib/format";
import { FileText, Download, Search, ShieldCheck } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/audit-logs")({
  head: () =>
    pageHead({
      title: "Audit Logs — AapnaCronJob Console",
      description:
        "Searchable compliance audit log of all schedule changes, rotations, and member invites.",
    }),
  component: AuditLogsPage,
});

export function AuditLogsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => DataStore.getAudit());
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("all");

  useEffect(() => {
    setEntries(DataStore.getAudit());
    DataStore.syncWithBackend().then((ok) => {
      if (ok) setEntries(DataStore.getAudit());
    });
  }, []);

  const actors = useMemo(() => {
    const set = new Set<string>(["all"]);
    entries.forEach((e) => {
      if (e.actor) set.add(e.actor);
    });
    return Array.from(set);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((item) => {
      const matchActor = actorFilter === "all" || item.actor === actorFilter;
      const matchSearch =
        item.action.toLowerCase().includes(search.toLowerCase()) ||
        item.target.toLowerCase().includes(search.toLowerCase()) ||
        item.actor.toLowerCase().includes(search.toLowerCase());
      return matchActor && matchSearch;
    });
  }, [entries, search, actorFilter]);

  const handleExport = () => {
    const csvRows = [
      ["Timestamp", "Actor", "Action", "Target", "Kind"].join(","),
      ...filtered.map(
        (e) =>
          `"${relativeLabel(e.minutesAgo)}","${e.actor}","${e.action}","${e.target}","${e.kind}"`,
      ),
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aapnacronjob-audit-trail-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Audit records exported to CSV successfully.");
  };

  return (
    <AppShell breadcrumbs={[{ label: "Audit Logs" }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow block mb-1">Compliance & Forensics</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
              Immutable record of schedule edits, API key operations, and team invitations.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={handleExport} className="font-mono text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions, actors, or targets..."
              className="pl-8 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {actors.map((act) => (
              <Button
                key={act}
                variant={actorFilter === act ? "default" : "outline"}
                size="sm"
                onClick={() => setActorFilter(act)}
                className="text-xs h-8 font-mono capitalize"
              >
                {act}
              </Button>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-paper-sunken border-b border-border text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3 text-right">Event Kind</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 text-muted-foreground">{relativeLabel(entry.minutesAgo)}</td>
                  <td className="p-3 font-semibold text-foreground">{entry.actor}</td>
                  <td className="p-3 text-foreground capitalize">{entry.action}</td>
                  <td className="p-3 text-foreground font-mono">{entry.target}</td>
                  <td className="p-3 text-right">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {entry.kind}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
