import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { demoIntegrations } from "@/lib/demo-data";
import { Search, ArrowRight, CheckCircle2, Blocks } from "lucide-react";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/integrations")({
  head: () =>
    pageHead({
      title: "Integration Directory — AapnaCronJob",
      description:
        "Connect AapnaCronJob to Slack, PagerDuty, Discord, GitHub, and custom webhooks.",
    }),
  component: IntegrationsDirectoryPage,
});

export function IntegrationsDirectoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = ["all", "Messaging", "Incident", "DevOps", "Data", "Webhooks"];

  const filtered = useMemo(() => {
    return demoIntegrations.filter((intg) => {
      const matchCat = category === "all" || intg.category.toLowerCase() === category.toLowerCase();
      const matchSearch =
        intg.name.toLowerCase().includes(search.toLowerCase()) ||
        intg.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="eyebrow block">Native Integrations</span>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              Connect AapnaCronJob to your entire workflow.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Streamline failure alerting, incident escalations, and automated deployment dispatches
              with native integrations.
            </p>
          </div>

          {/* Search & Category filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search integrations..."
                className="pl-9 font-mono text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className="text-xs h-8 font-mono capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between hover:border-foreground/30 transition-colors space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-bold text-base text-foreground">
                      {item.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                  <span
                    className={
                      item.connected ? "text-emerald-600 font-semibold" : "text-muted-foreground"
                    }
                  >
                    {item.connected ? "✓ Connected" : "Available"}
                  </span>
                  <Link to="/app/integrations">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-mono text-cobalt hover:underline"
                    >
                      Configure →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
