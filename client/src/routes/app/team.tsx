import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataStore } from "@/lib/data-store";
import type { TeamMember } from "@/types";
import { Users, UserPlus, Shield, Trash2 } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/team")({
  head: () =>
    pageHead({
      title: "Team Management — AapnaCronJob Console",
      description: "Manage organization members, workspace access, and role assignments.",
    }),
  component: TeamManagementPage,
});

export function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>(() => DataStore.getTeam());
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Owner" | "Admin" | "Editor" | "Viewer">("Editor");

  useEffect(() => {
    setMembers(DataStore.getTeam());
    DataStore.syncWithBackend().then((ok) => {
      if (ok) setMembers(DataStore.getTeam());
    });
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please enter both collaborator name and email.");
      return;
    }

    const invited = await DataStore.inviteMember(name, email, role);
    setMembers(DataStore.getTeam());
    setIsInviteOpen(false);
    setName("");
    setEmail("");
    toast.success(`Invitation for ${invited.email} (${invited.role}) saved to database.`);
  };

  const handleRemoveMember = async (id: string, memberName: string) => {
    await DataStore.removeMember(id);
    setMembers(DataStore.getTeam());
    toast.info(`Member “${memberName}” removed from database.`);
  };

  return (
    <AppShell breadcrumbs={[{ label: "Team Members" }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <span className="eyebrow block mb-1">Access Control</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Team Members
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
              Manage workspace collaborators and RBAC roles (Owner, Admin, Editor, Viewer).
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            className="bg-foreground text-background font-mono text-xs hover:bg-foreground/90"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Invite Member
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-sunken border border-border font-mono text-xs font-bold text-foreground">
                  {m.initials}
                </div>
                <div>
                  <span className="font-semibold text-sm text-foreground block font-sans">
                    {m.name}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{m.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${
                    m.role === "Owner"
                      ? "text-cobalt border-cobalt/30"
                      : m.role === "Admin"
                        ? "text-purple-600 border-purple-500/30"
                        : "text-muted-foreground"
                  }`}
                >
                  {m.role}
                </Badge>

                {m.role !== "Owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(m.id, m.name)}
                    className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger-soft/20"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">
              Invite Workspace Collaborator
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                Work Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@company.dev"
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                Role & Permissions
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono"
              >
                <option value="Admin">Admin (Full schedule & team permissions)</option>
                <option value="Editor">Editor (Create, edit, trigger jobs)</option>
                <option value="Viewer">Viewer (Read-only metrics & audit access)</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-foreground text-background">
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
