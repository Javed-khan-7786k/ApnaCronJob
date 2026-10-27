import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, Download, ArrowUpRight } from "lucide-react";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/app/billing")({
  head: () =>
    pageHead({
      title: "Billing & Plans — AapnaCronJob Console",
      description: "Manage subscription plans, invoices, and usage meters.",
    }),
  component: BillingManagementPage,
});

export function BillingManagementPage() {
  const invoices = [
    { id: "INV-2026-009", date: "Oct 1, 2026", amount: "$24.00", status: "Paid" },
    { id: "INV-2026-008", date: "Sep 1, 2026", amount: "$24.00", status: "Paid" },
    { id: "INV-2026-007", date: "Aug 1, 2026", amount: "$24.00", status: "Paid" },
  ];

  const downloadInvoice = (inv: (typeof invoices)[0]) => {
    const content = `AAPNACRONJOB INVOICE RECEIPT\n---------------------------\nInvoice ID: ${inv.id}\nDate: ${inv.date}\nAmount: ${inv.amount}\nStatus: ${inv.status}\nPayment Method: Visa ending in 4242\nEntity: AapnaCronJob Inc.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Invoice ${inv.id} downloaded successfully.`);
  };

  return (
    <AppShell breadcrumbs={[{ label: "Billing & Usage" }]}>
      <div className="space-y-6">
        <div className="border-b border-border/80 pb-6">
          <span className="eyebrow block mb-1">Financial Management</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Billing & Usage
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
            Manage your subscription tier, billing contact, and payment methods.
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="rounded-xl border-2 border-cobalt bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl text-foreground">
                Professional Plan
              </span>
              <Badge className="bg-cobalt text-white font-mono text-[10px]">
                Active Subscription
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              $24.00 billed monthly on the 1st. Next billing date: November 1, 2026.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
              <span>Unlimited Jobs</span>
              <span>•</span>
              <span>90-Day Retention</span>
              <span>•</span>
              <span>Sub-Second Precision</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/pricing">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                Change Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* Usage meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <span className="eyebrow text-muted-foreground">Active Jobs</span>
            <div className="font-mono text-2xl font-bold text-foreground">
              8 <span className="text-xs text-muted-foreground font-normal">/ Unlimited</span>
            </div>
            <div className="w-full bg-paper-sunken h-1.5 rounded-full overflow-hidden">
              <div className="bg-cobalt h-full w-[15%]" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <span className="eyebrow text-muted-foreground">Monthly Invocations</span>
            <div className="font-mono text-2xl font-bold text-foreground">
              42,810 <span className="text-xs text-muted-foreground font-normal">/ 500,000</span>
            </div>
            <div className="w-full bg-paper-sunken h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[8%]" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <span className="eyebrow text-muted-foreground">Data Egress</span>
            <div className="font-mono text-2xl font-bold text-foreground">
              1.8 GB <span className="text-xs text-muted-foreground font-normal">/ 50 GB</span>
            </div>
            <div className="w-full bg-paper-sunken h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full w-[4%]" />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold text-sm text-foreground">
              Invoice History
            </h2>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-paper-sunken border-b border-border text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Invoice</th>
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20">
                  <td className="p-3 font-semibold text-foreground">{inv.id}</td>
                  <td className="p-3 text-muted-foreground">{inv.date}</td>
                  <td className="p-3 font-semibold text-foreground">{inv.amount}</td>
                  <td className="p-3">
                    <span className="text-emerald-600 font-semibold">{inv.status}</span>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadInvoice(inv)}
                      className="h-6 text-[11px] font-mono"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
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
