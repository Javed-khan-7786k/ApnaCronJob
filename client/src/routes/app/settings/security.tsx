import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { DataStore } from "@/lib/data-store";
import { Shield, Lock, Key, Copy, CheckCircle2, QrCode, ShieldCheck, Globe } from "lucide-react";
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

  // 2FA Setup State
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const totpSecret = "JBSWY3DPEHPK3PXP";

  // SAML SSO Modal State
  const [isSAMLModalOpen, setIsSAMLModalOpen] = useState(false);
  const [samlEntityId, setSamlEntityId] = useState("https://auth.aapnacronjob.com/saml/metadata");
  const [samlAcsUrl, setSamlAcsUrl] = useState(
    "https://api.aapnacronjob.com/api/auth/saml/callback",
  );
  const [idpMetadataUrl, setIdpMetadataUrl] = useState("");

  useEffect(() => {
    const s = DataStore.getSettings();
    setTwoFactor(s.twoFactor);
    setEnforceSso(s.enforceSso);
  }, []);

  const handle2FAToggle = (checked: boolean) => {
    if (checked) {
      setIs2FAModalOpen(true);
    } else {
      setTwoFactor(false);
      DataStore.saveSettings({ twoFactor: false });
      toast.info("Two-factor authentication disabled.");
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6 || !/^\d+$/.test(totpCode.trim())) {
      toast.error("Please enter a valid 6-digit numeric verification code.");
      return;
    }

    const generatedBackupCodes = [
      "crn-rec-" + Math.floor(1000 + Math.random() * 9000),
      "crn-rec-" + Math.floor(1000 + Math.random() * 9000),
      "crn-rec-" + Math.floor(1000 + Math.random() * 9000),
      "crn-rec-" + Math.floor(1000 + Math.random() * 9000),
    ];
    setBackupCodes(generatedBackupCodes);
    setTwoFactor(true);
    DataStore.saveSettings({ twoFactor: true });
    toast.success("Two-Factor Authentication activated successfully!");
  };

  const handleSAMLToggle = (checked: boolean) => {
    if (checked) {
      setIsSAMLModalOpen(true);
    } else {
      setEnforceSso(false);
      DataStore.saveSettings({ enforceSso: false });
      toast.info("SAML SSO enforcement disabled.");
    }
  };

  const handleSaveSAML = (e: React.FormEvent) => {
    e.preventDefault();
    setEnforceSso(true);
    DataStore.saveSettings({ enforceSso: true });
    setIsSAMLModalOpen(false);
    toast.success("SAML SSO identity provider configurations saved.");
  };

  return (
    <AppShell breadcrumbs={[{ label: "Settings", to: "/app/settings" }, { label: "Security" }]}>
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
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground block">
                  Two-Factor Authentication (MFA)
                </span>
                {twoFactor && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                    Active
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground font-sans">
                Require a TOTP authenticator code when signing into this workspace.
              </span>
            </div>
            <Switch checked={twoFactor} onCheckedChange={handle2FAToggle} />
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground block">
                  Enforce SAML Single Sign-On
                </span>
                {enforceSso && (
                  <Badge className="bg-cobalt/10 text-cobalt font-mono text-[10px]">Enforced</Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground font-sans">
                Require all team members to authenticate through Okta or Google Workspace SSO.
              </span>
            </div>
            <Switch checked={enforceSso} onCheckedChange={handleSAMLToggle} />
          </div>

          <div className="rounded-lg border border-border bg-paper-sunken p-4 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="font-bold text-foreground">Encryption Standards</span>
            </div>
            <p className="text-muted-foreground font-sans leading-relaxed text-[11px]">
              Outgoing request secrets are protected using AES-256-GCM envelope encryption.
              Decrypted keys reside only in volatile memory on runner nodes during active dispatch.
            </p>
          </div>
        </div>

        {/* 2FA Setup Modal */}
        <Dialog open={is2FAModalOpen} onOpenChange={setIs2FAModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-cobalt" />
                Configure Two-Factor Authenticator
              </DialogTitle>
              <DialogDescription className="text-xs">
                Scan the secret code with Google Authenticator, Authy, or 1Password.
              </DialogDescription>
            </DialogHeader>

            {backupCodes.length === 0 ? (
              <form onSubmit={handleVerify2FA} className="space-y-4 pt-2">
                <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
                  <span className="text-[11px] uppercase font-mono text-muted-foreground block">
                    Manual Secret Key
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-foreground tracking-wider select-all">
                      {totpSecret}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(totpSecret);
                        toast.success("MFA Secret copied to clipboard");
                      }}
                      className="h-7 text-xs font-mono"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-foreground block">
                    Enter 6-Digit Verification Code
                  </label>
                  <Input
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="e.g. 842109"
                    maxLength={6}
                    required
                    className="font-mono text-center tracking-widest text-base"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIs2FAModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-foreground text-background">
                    Verify & Activate
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    Two-Factor Authentication Active
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Save these backup recovery codes in a safe place. You will need them if you lose
                    access to your device.
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px] font-bold p-2 bg-background rounded border border-border">
                    {backupCodes.map((c, i) => (
                      <span key={i} className="text-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    className="w-full bg-foreground text-background"
                    onClick={() => {
                      setIs2FAModalOpen(false);
                      setBackupCodes([]);
                      setTotpCode("");
                    }}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* SAML Configuration Modal */}
        <Dialog open={isSAMLModalOpen} onOpenChange={setIsSAMLModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-cobalt" />
                Configure SAML 2.0 Single Sign-On
              </DialogTitle>
              <DialogDescription className="text-xs">
                Provide these service provider details to your Identity Provider (Okta, Azure AD,
                Google).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveSAML} className="space-y-4 pt-2 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-muted-foreground uppercase text-[10px]">SP Entity ID</label>
                <Input value={samlEntityId} readOnly className="bg-muted/40 text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase text-[10px]">ACS URL</label>
                <Input value={samlAcsUrl} readOnly className="bg-muted/40 text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-foreground">IdP Metadata XML URL</label>
                <Input
                  value={idpMetadataUrl}
                  onChange={(e) => setIdpMetadataUrl(e.target.value)}
                  placeholder="https://identity.yourdomain.com/saml/metadata.xml"
                  required
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsSAMLModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-foreground text-background">
                  Save & Enforce SSO
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
