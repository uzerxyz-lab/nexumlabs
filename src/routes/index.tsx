import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Scale, Wallet } from "lucide-react";
import { EntryForm } from "@/components/app/EntryForm";
import { EntriesTable } from "@/components/app/EntriesTable";
import { PageHeader } from "@/components/app/inputs";
import { accountBalance, cashFlow, liveAccounts, liveEntries, useData, ENTRY_TYPES } from "@/lib/db";
import { fmtDate, fmtPKR, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Mussa Enterprises Cash Book" },
      { name: "description", content: "Today's cash in, cash out, receivables and quick voucher entry." },
      { property: "og:title", content: "Dashboard — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "Today's cash in, cash out, receivables and quick voucher entry." },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Wallet; tone: "success" | "danger" | "primary" | "neutral" }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={cn("rounded-md p-1.5", tone === "success" && "bg-success-soft text-success", tone === "danger" && "bg-danger-soft text-destructive", tone === "primary" && "bg-accent text-accent-foreground", tone === "neutral" && "bg-secondary text-secondary-foreground")}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="num mt-3 text-2xl font-semibold">{fmtPKR(value)}</div>
    </div>
  );
}

function Dashboard() {
  const d = useData();
  const today = todayISO();
  const entries = liveEntries(d);
  const todays = entries.filter((e) => e.date === today);
  const cashIn = todays.filter((e) => ENTRY_TYPES[e.type].flow === "in").reduce((s, e) => s + e.amount, 0);
  const cashOut = todays.filter((e) => ENTRY_TYPES[e.type].flow === "out").reduce((s, e) => s + e.amount, 0);
  const cashInHand = entries.filter((e) => e.method === "cash").reduce((s, e) => s + cashFlow(e), 0);
  const balances = liveAccounts(d).map((a) => ({ a, b: accountBalance(d, a.id) }));
  const receivable = balances.filter((x) => x.b > 0).reduce((s, x) => s + x.b, 0);
  const payable = balances.filter((x) => x.b < 0).reduce((s, x) => s - x.b, 0);
  const recent = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const top = balances.filter((x) => x.b !== 0).sort((x, y) => Math.abs(y.b) - Math.abs(x.b)).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Today · ${fmtDate(today)}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today Cash In" value={cashIn} icon={ArrowDownLeft} tone="success" />
        <Stat label="Today Cash Out" value={cashOut} icon={ArrowUpRight} tone="danger" />
        <Stat label="Cash in Hand" value={cashInHand} icon={Wallet} tone="primary" />
        <Stat label="Receivable − Payable" value={receivable - payable} icon={Scale} tone="neutral" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-card p-5 xl:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">New Voucher</h2>
          <EntryForm />
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top Balances</h2>
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-success-soft p-2"><div className="text-muted-foreground">Receivable</div><div className="num font-semibold text-success">{fmtPKR(receivable)}</div></div>
            <div className="rounded-md bg-danger-soft p-2"><div className="text-muted-foreground">Payable</div><div className="num font-semibold text-destructive">{fmtPKR(payable)}</div></div>
          </div>
          {top.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No balances yet. <Link to="/accounts" className="text-primary hover:underline">Add an account</Link></p>
          ) : (
            <ul className="divide-y">
              {top.map(({ a, b }) => (
                <li key={a.id}>
                  <Link to="/ledger/$id" params={{ id: a.id }} className="flex items-center justify-between py-2 text-sm hover:text-primary">
                    <span>{a.name} <span className="num text-xs text-muted-foreground">{a.code}</span></span>
                    <span className={cn("num font-medium", b > 0 ? "text-success" : "text-destructive")}>{fmtPKR(Math.abs(b), false)} {b > 0 ? "Dr" : "Cr"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Entries</h2>
          <Link to="/entries" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <EntriesTable entries={recent} />
      </section>
    </div>
  );
}
