import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, BookOpen, CalendarDays, CirclePlus, Receipt, Scale, Wallet } from "lucide-react";
import { EntryForm } from "@/components/app/EntryForm";
import { TypeBadge } from "@/components/app/EntriesTable";
import { Button } from "@/components/ui/button";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof Wallet; tone: "success" | "danger" | "primary" | "neutral" }) {
  return (
    <div className="flex min-h-32 flex-col justify-between rounded-lg border bg-card p-3 shadow-sm sm:min-h-36 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md sm:h-9 sm:w-9", tone === "success" && "bg-success-soft text-success", tone === "danger" && "bg-danger-soft text-destructive", tone === "primary" && "bg-accent text-primary", tone === "neutral" && "bg-secondary text-secondary-foreground")}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div>
        <div className="num break-words text-lg font-semibold leading-tight text-foreground sm:text-2xl">{fmtPKR(value)}</div>
        <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const d = useData();
  const today = todayISO();
  const entries = liveEntries(d);
  const todays = entries.filter((e) => e.date === today);
  const cashIn = todays.filter((e) => ENTRY_TYPES[e.type].flow === "in" && e.chequeStatus !== "bounced").reduce((s, e) => s + e.amount, 0);
  const cashOut = todays.filter((e) => ENTRY_TYPES[e.type].flow === "out" && e.chequeStatus !== "bounced").reduce((s, e) => s + e.amount, 0);
  const cashInHand = entries.filter((e) => e.method === "cash").reduce((s, e) => s + cashFlow(e), 0);
  const balances = liveAccounts(d).map((a) => ({ a, b: accountBalance(d, a.id) }));
  const receivable = balances.filter((x) => x.b > 0).reduce((s, x) => s + x.b, 0);
  const payable = balances.filter((x) => x.b < 0).reduce((s, x) => s - x.b, 0);
  const recent = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const top = balances.filter((x) => x.b !== 0).sort((x, y) => Math.abs(y.b) - Math.abs(x.b)).slice(0, 5);
  const monthEntries = entries.filter((e) => e.date.startsWith(today.slice(0, 7)));
  const monthTotal = (type: typeof entries[number]["type"]) => monthEntries.filter((e) => e.type === type).reduce((sum, e) => sum + e.amount, 0);
  const reportRows = [
    { label: "Sales", value: monthTotal("sale"), icon: BarChart3, tone: "text-primary" },
    { label: "Purchases", value: monthTotal("purchase"), icon: BookOpen, tone: "text-muted-foreground" },
    { label: "Expenses", value: monthTotal("expense"), icon: Receipt, tone: "text-destructive" },
    { label: "Salaries & advances", value: monthTotal("salary") + monthTotal("advance"), icon: Wallet, tone: "text-warning" },
  ];
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() - (6 - i));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dayEntries = entries.filter((e) => e.date === key && e.chequeStatus !== "bounced");
    return {
      key,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.getDate(),
      incoming: dayEntries.filter((e) => ENTRY_TYPES[e.type].flow === "in").reduce((s, e) => s + e.amount, 0),
      outgoing: dayEntries.filter((e) => ENTRY_TYPES[e.type].flow === "out").reduce((s, e) => s + e.amount, 0),
    };
  });
  const chartMax = Math.max(1, ...days.flatMap((day) => [day.incoming, day.outgoing]));
  const weekIn = days.reduce((s, day) => s + day.incoming, 0);
  const weekOut = days.reduce((s, day) => s + day.outgoing, 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-primary">Mussa Enterprises / Overview</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" /> {fmtDate(today)} · Financial overview</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/reports"><BarChart3 className="h-4 w-4" /> View reports</Link></Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Cash in hand" value={cashInHand} detail="Cash payments only · all time" icon={Wallet} tone="primary" />
        <Stat label="Received today" value={cashIn} detail="All payment methods" icon={ArrowDownLeft} tone="success" />
        <Stat label="Paid today" value={cashOut} detail="All payment methods" icon={ArrowUpRight} tone="danger" />
        <Stat label="Net party position" value={receivable - payable} detail="Receivable less payable" icon={Scale} tone="neutral" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <section className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><h2 className="text-base font-semibold">Payment movement</h2><p className="text-xs text-muted-foreground">Last 7 days · all payment methods</p></div>
            <Link to="/cashbook" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Cash book <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
              <div><p className="text-xs text-muted-foreground">Total received</p><p className="num mt-1 text-lg font-semibold text-success">{fmtPKR(weekIn)}</p></div>
              <div><p className="text-xs text-muted-foreground">Total paid</p><p className="num mt-1 text-lg font-semibold text-destructive">{fmtPKR(weekOut)}</p></div>
              <div><p className="text-xs text-muted-foreground">Net movement</p><p className="num mt-1 text-lg font-semibold">{fmtPKR(weekIn - weekOut)}</p></div>
            </div>
            <div className="mt-5 flex h-32 items-end justify-between gap-2 sm:gap-4" aria-label="Daily receipts and payments over the past seven days">
              {days.map((day) => (
                <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${fmtDate(day.key)} · Received ${fmtPKR(day.incoming)} · Paid ${fmtPKR(day.outgoing)}`}>
                  <div className="flex h-full w-full max-w-16 items-end justify-center gap-1 rounded-sm border-b border-border bg-surface/50 px-1">
                    <div className="w-1/2 max-w-5 rounded-t-sm bg-success transition-[height]" style={{ height: `${day.incoming ? Math.max(5, day.incoming / chartMax * 100) : 2}%` }} />
                    <div className="w-1/2 max-w-5 rounded-t-sm bg-destructive transition-[height]" style={{ height: `${day.outgoing ? Math.max(5, day.outgoing / chartMax * 100) : 2}%` }} />
                  </div>
                  <span className="text-center text-[11px] leading-tight text-muted-foreground">{day.label}<span className="block">{day.date}</span></span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-success" /> Received</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-destructive" /> Paid</span></div>
          </div>
        </section>
        <section className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><h2 className="text-base font-semibold">Monthly report</h2><p className="text-xs text-muted-foreground">{new Date(`${today}T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p></div>
            <Link to="/reports" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Full report <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-lg border bg-card px-5 shadow-sm">
            {reportRows.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="flex items-center gap-3 border-b py-4 last:border-0">
                <Icon className={cn("h-4 w-4 shrink-0", tone)} />
                <span className="min-w-0 flex-1 text-sm text-muted-foreground">{label}</span>
                <span className="num text-right text-sm font-semibold">{fmtPKR(value)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h2 className="text-base font-semibold">Recent entries</h2><p className="text-xs text-muted-foreground">Latest vouchers across all accounts</p></div>
            <Link to="/entries" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">All entries <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            {recent.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted-foreground">No entries yet. Save your first voucher below.</p> : (
              <div className="divide-y">
                {recent.map((entry) => {
                  const account = d.accounts.find((a) => a.id === entry.accountId);
                  const category = d.categories.find((c) => c.id === entry.categoryId);
                  return (
                    <Link key={entry.id} to="/voucher/$id" params={{ id: entry.id }} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface sm:gap-4">
                      <span className="w-12 shrink-0 num text-xs text-muted-foreground">V-{entry.voucherNo}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{account?.name ?? category?.name ?? ENTRY_TYPES[entry.type].label}</span><span className="block truncate text-xs text-muted-foreground">{fmtDate(entry.date)} · {entry.particulars}</span></span>
                      <span className="hidden sm:block"><TypeBadge type={entry.type} /></span>
                      <span className="num shrink-0 text-right text-xs font-semibold sm:text-sm">{fmtPKR(entry.amount)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h2 className="text-base font-semibold">Account position</h2><p className="text-xs text-muted-foreground">Outstanding balances</p></div>
            <Link to="/accounts" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Accounts <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div className="min-w-0"><p className="text-xs text-muted-foreground">Receivable</p><p className="num mt-1 break-words text-base font-semibold text-success">{fmtPKR(receivable)}</p></div>
              <div className="min-w-0 border-l pl-4"><p className="text-xs text-muted-foreground">Payable</p><p className="num mt-1 break-words text-base font-semibold text-destructive">{fmtPKR(payable)}</p></div>
            </div>
            {top.length === 0 ? <p className="py-7 text-center text-sm text-muted-foreground">No outstanding balances. <Link to="/accounts" className="font-medium text-primary hover:underline">Add an account</Link></p> : (
              <ul className="divide-y">
                {top.map(({ a, b }) => (
                  <li key={a.id}>
                    <Link to="/ledger/$id" params={{ id: a.id }} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary">
                      <span className="min-w-0 truncate font-medium">{a.name}<span className="ml-1.5 num text-xs font-normal text-muted-foreground">{a.code}</span></span>
                      <span className={cn("num shrink-0 text-xs font-semibold", b > 0 ? "text-success" : "text-destructive")}>{fmtPKR(Math.abs(b))} {b > 0 ? "Dr" : "Cr"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section id="new-voucher" className="border-t pt-6">
        <div className="mb-4 flex items-center gap-2"><CirclePlus className="h-5 w-5 text-primary" /><h2 className="text-base font-semibold">New voucher</h2></div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <EntryForm />
        </div>
      </section>
    </div>
  );
}
