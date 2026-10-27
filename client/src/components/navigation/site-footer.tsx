import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Github, Shield, Terminal, Globe, Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-paper-sunken/60 text-muted-foreground">
      {/* Upper editorial banner */}
      <div className="border-b border-border/80 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="eyebrow block mb-1">Reliability Guarantee</span>
            <p className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Built for engineering teams who cannot afford silent failures.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/status"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-600 dark:text-emerald-400"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.99%)</span>
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3.5 py-1.5 font-mono text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
            >
              <span>Launch Developer Console</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Column Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-border bg-foreground text-background font-mono font-bold text-sm">
                A
              </div>
              <span className="font-display font-extrabold tracking-tight text-foreground text-base">
                Aapna<span className="text-cobalt">CronJob</span>
              </span>
            </div>
            <p className="text-xs font-sans leading-relaxed text-muted-foreground">
              Production-grade distributed cron scheduler and HTTP endpoint monitor. Sub-second
              dispatch, multi-region failover, and zero silent failures.
            </p>

            <div className="pt-2 text-[11px] font-mono text-muted-foreground">
              <div>Designed with Editorial Clarity</div>
              <div>& Minimal Architecture</div>
            </div>
          </div>

          {/* Product Col */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link to="/features" className="hover:text-foreground transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/features/cron-scheduler"
                  className="hover:text-foreground transition-colors"
                >
                  Cron Scheduler
                </Link>
              </li>
              <li>
                <Link
                  to="/features/http-monitoring"
                  className="hover:text-foreground transition-colors"
                >
                  HTTP Health Checks
                </Link>
              </li>
              <li>
                <Link to="/features/retries" className="hover:text-foreground transition-colors">
                  Retries & Backoff
                </Link>
              </li>
              <li>
                <Link
                  to="/features/notifications"
                  className="hover:text-foreground transition-colors"
                >
                  Multi-channel Alerts
                </Link>
              </li>
              <li>
                <Link to="/features/webhooks" className="hover:text-foreground transition-colors">
                  Webhook Scheduling
                </Link>
              </li>
              <li>
                <Link to="/integrations" className="hover:text-foreground transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">
                  Plans & Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Documentation Col */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold mb-3">
              Documentation
            </h3>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link to="/docs" className="hover:text-foreground transition-colors">
                  Docs Hub
                </Link>
              </li>
              <li>
                <Link to="/docs/quickstart" className="hover:text-foreground transition-colors">
                  Quickstart Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/docs/cron-expressions"
                  className="hover:text-foreground transition-colors"
                >
                  Cron Syntax Reference
                </Link>
              </li>
              <li>
                <Link to="/docs/api" className="hover:text-foreground transition-colors">
                  REST API Reference
                </Link>
              </li>
              <li>
                <Link to="/changelog" className="hover:text-foreground transition-colors">
                  Release Changelog
                </Link>
              </li>
              <li>
                <Link to="/status" className="hover:text-foreground transition-colors">
                  Global Status Page
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold mb-3">
              Company
            </h3>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  About AapnaCronJob
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/status" className="hover:text-foreground transition-colors">
                  Incident History
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <span>GitHub</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold mb-3">
              Trust & Legal
            </h3>
            <ul className="space-y-2 text-xs font-sans">
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/app/audit-logs" className="hover:text-foreground transition-colors">
                  Security & Audit Logs
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 font-mono">
                  <Shield className="h-3 w-3 text-cobalt" />
                  SOC2 Type II Ready
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-border/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <p>© {new Date().getFullYear()} AapnaCronJob Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>UTC Engine Synchronized</span>
            <span>•</span>
            <span>Zero-Trust Header Encryption</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
