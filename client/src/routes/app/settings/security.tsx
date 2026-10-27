import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DataStore } from "@/lib/data-store";
import { Shield, Lock, Key, AlertTriangle } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings/security")({
  head: () =>
    pageHead({
      title: "Security & Authentication — AapnaCronJob Console",
      description: "Manage two-factor authentication, SAML SSO, and encryption policies.",
    }),
  component: SettingsSecurityPage,
});

export function SettingsSecurityPage() {
  const currentSettings = DataStore.getSettings();
  const [twoFactor, setTwoFactor] = useState(currentSettings.twoFactor);
  const [enforceSso, setEnforceSso] = useState(currentSettings.enforceSso);

  useEffect(() => {
    const s = DataStore.getSettings();
    setTwoFactor(s.twoFactor);
    setEnforceSso(s.enforceSso);
  }, []);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Settings", to: "/app/settings" },
        { label: "Security" },
      ]}
    >
      <div className="space-y-6 max-w-4xl">
        <div className="border-b border-border/80 pb-6">
          <span className="eyebrow block mb-1">Protection & Access</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Security & Authentication
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
            Configure MFA, session lifespans, and zero-trust runner security parameters.
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
            className="pb-2 px-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          >
            Timezone & Clock
          </Link>
          <Link
            to="/app/settings/security"
            className="pb-2 px-3 border-b-2 border-foreground text-foreground font-semibold"
          >
            Security & Authentication
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-xs text-foreground block">
                Two-Factor Authentication (MFA)
              </span>
              <span className="text-[11px] text-muted-foreground font-sans">
                Require a TOTP authenticator code when signing into this workspace.
              </span>
            </div>
            <Switch
              checked={twoFactor}
              onCheckedChange={(v) => {
                setTwoFactor(v);
                DataStore.saveSettings({ twoFactor: v });
                toast.info(`Two-factor authentication ${v ? "enabled" : "disabled"}`);
              }}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <div className="space-y-1">
              <span className="font-semibold text-xs text-foreground block">
                Enforce SAML Single Sign-On
              </span>
              <span className="text-[11px] text-muted-foreground font-sans">
                Require all team members to authenticate through Okta or Google Workspace SSO.
              </span>
            </div>
            <Switch
              checked={enforceSso}
              onCheckedChange={(v) => {
                setEnforceSso(v);
                DataStore.saveSettings({ enforceSso: v });
                toast.info(`SAML SSO enforcement ${v ? "enabled" : "disabled"}`);
              }}
            />
          </div>

          <div className="rounded-lg border border-border bg-paper-sunken p-4 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="font-bold text-foreground">Encryption Standards</span>
            </div>
            <p className="text-muted-foreground font-sans leading-relaxed text-[11px]">
              Outgoing request secrets are protected using AES-256-GCM envelope encryption. Decrypted keys reside only in volatile memory on runner nodes during active dispatch.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
