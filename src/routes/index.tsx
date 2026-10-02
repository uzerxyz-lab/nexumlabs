import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownLeft, ArrowUpRight, BarChart3, BookOpen, Receipt,
  RotateCcw, ShoppingCart, UserPlus, UsersRound, Wallet, Scale,
} from "lucide-react";
import { EntryForm } from "@/components/app/EntryForm";
import { AccountForm } from "@/components/app/AccountForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { accountBalance, cashFlow, liveAccounts, liveEntries, useData, ENTRY_TYPES, type EntryType } from "@/lib/db";
import { fmtPKR, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Mussa Enterprises Cash Book" },
      { name: "description", content: "Bento dashboard: cash summary, quick sale/purchase, accounts, ledgers and reports." },
      { property: "og:title", content: "Dashboard — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "Bento dashboard: cash summary, quick sale/purchase, accounts, ledgers and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const ORDER_KEY = "cashbook-tile-order";
const DEFAULT_ORDER = ["summary", "inflow", "outflow", "sale", "purchase", "account", "workers", "ledgers", "reports", "expense"];
type Tone = "received" | "paid" | "sale" | "purchase" | "account" | "ledger" | "report" | "expense" | "entries" | "admin" | "hero";
const toneCls: Record<Tone, string> = {
  received: "bg-received text-hero-foreground",
  paid: "bg-paid text-hero-foreground",
  sale: "bg-sale text-hero-foreground",
  purchase: "bg-purchase text-hero-foreground",
  account: "bg-account text-hero-foreground",
  ledger: "bg-ledger-card text-hero-foreground",
  report: "bg-report-card text-hero-foreground",
  expense: "bg-expense-card text-hero-foreground",
  entries: "bg-entry-card text-hero-foreground",
  admin: "bg-admin-card text-hero-foreground",
  hero: "bg-hero text-hero-foreground",
};
const softCls: Record<Tone, string> = {
  received: "border-received/40 bg-received-soft",
  paid: "border-paid/40 bg-paid-soft",
  sale: "border-sale/40 bg-sale-soft",
  purchase: "border-purchase/40 bg-purchase-soft",
  account: "border-account/40 bg-account-soft",
  ledger: "border-ledger-card/40 bg-ledger-card-soft",
  report: "border-report-card/40 bg-report-card-soft",
  expense: "border-expense-card/40 bg-expense-card-soft",
  entries: "border-entry-card/40 bg-entry-card-soft",
  admin: "border-admin-card/40 bg-admin-card-soft",
  hero: "border-hero/40 bg-hero/20",
};

function Dashboard() {
  const d = useData();
  const today = todayISO();
  const entries = liveEntries(d);
  const todays = entries.filter((e) => e.date === today && e.chequeStatus !== "bounced");
  const cashIn = todays.filter((e) => ENTRY_TYPES[e.type].flow === "in").reduce((s, e) => s + e.amount, 0);
  const cashOut = todays.filter((e) => ENTRY_TYPES[e.type].flow === "out").reduce((s, e) => s + e.amount, 0);
  const cashInHand = entries.filter((e) => e.method === "cash").reduce((s, e) => s + cashFlow(e), 0);
  const balances = liveAccounts(d).map((a) => accountBalance(d, a.id));
  const receivable = balances.filter((b) => b > 0).reduce((s, b) => s + b, 0);
  const payable = balances.filter((b) => b < 0).reduce((s, b) => s - b, 0);
  const month = entries.filter((e) => e.date.startsWith(today.slice(0, 7)));
  const mt = (t: EntryType) => month.filter((e) => e.type === t).reduce((s, e) => s + e.amount, 0);

  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [drag, setDrag] = useState<string>();
  const [entryType, setEntryType] = useState<EntryType>();
  const [newAcc, setNewAcc] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "null") as string[] | null;
      if (saved) setOrder([...saved.filter((k) => DEFAULT_ORDER.includes(k)), ...DEFAULT_ORDER.filter((k) => !saved.includes(k))]);
    } catch { /* ignore */ }
  }, []);
  const save = (o: string[]) => { setOrder(o); localStorage.setItem(ORDER_KEY, JSON.stringify(o)); };
  const dropOn = (target: string) => {
    if (!drag || drag === target) return;
    const o = order.filter((k) => k !== drag); o.splice(o.indexOf(target), 0, drag); save(o); setDrag(undefined);
  };

  const tiles: Record<string, { span: string; node: ReactNode }> = {
    summary: { span: "col-span-2 row-span-2", node: (
      <div className={cn("flex h-full flex-col justify-between rounded-2xl p-5 sm:p-6", toneCls.hero)}>
        <Head icon={Wallet} label="Cash in hand" light />
        <div>
          <div className="num text-3xl font-semibold sm:text-4xl">{fmtPKR(cashInHand)}</div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Mini label="Receivable" value={receivable} />
            <Mini label="Payable" value={payable} />
            <Mini label="Sales this month" value={mt("sale")} />
            <Mini label="Expenses this month" value={mt("expense")} />
          </div>
        </div>
      </div>) },
    inflow: { span: "", node: <StatTile tone="received" icon={ArrowDownLeft} label="Received today" value={cashIn} onClick={() => setEntryType("inward")} cta="New receipt" /> },
    outflow: { span: "", node: <StatTile tone="paid" icon={ArrowUpRight} label="Paid today" value={cashOut} onClick={() => setEntryType("outward")} cta="New payment" /> },
    sale: { span: "", node: <FilteredEntryTile tone="sale" icon={BarChart3} label="Sales Ledger" detail={`This month ${fmtPKR(mt("sale"))}`} type="sale" /> },
    purchase: { span: "", node: <FilteredEntryTile tone="purchase" icon={ShoppingCart} label="Purchase Ledger" detail={`This month ${fmtPKR(mt("purchase"))}`} type="purchase" /> },
    account: { span: "", node: <ActionTile tone="account" icon={UserPlus} label="New Account" detail={`${liveAccounts(d).length} accounts`} onClick={() => setNewAcc(true)} /> },
    workers: { span: "", node: <AccountCategoryTile tone="entries" icon={UsersRound} label="Workers" detail={`${liveAccounts(d).filter((a) => a.type === "worker").length} worker accounts`} type="worker" /> },
    ledgers: { span: "col-span-2", node: <LinkTile tone="ledger" icon={BookOpen} label="Ledgers & Accounts" detail={`${liveAccounts(d).filter((a) => a.type === "customer").length} customers · ${liveAccounts(d).filter((a) => a.type === "supplier").length} suppliers · ${liveAccounts(d).filter((a) => a.type === "worker").length} workers`} to="/accounts" /> },
    reports: { span: "col-span-2", node: <LinkTile tone="report" icon={Scale} label="Reports" detail="Cash book, sales, purchases, salaries and expenses" to="/reports" /> },
    expense: { span: "col-span-2", node: <ActionTile tone="expense" icon={Receipt} label="Expense" detail={`This month ${fmtPKR(mt("expense"))}`} onClick={() => setEntryType("expense")} /> },
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button onClick={() => save(DEFAULT_ORDER)} title="Reset tile order" aria-label="Reset tile order" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"><RotateCcw className="h-4 w-4" /></button>
      </div>
      <div className="grid auto-rows-[minmax(150px,auto)] grid-flow-dense grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
        {order.map((k) => {
          const t = tiles[k]; if (!t) return null;
          return (
            <div
              key={k}
              draggable
              onDragStart={() => setDrag(k)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(k)}
              className={cn("relative min-w-0 cursor-grab active:cursor-grabbing", t.span, drag === k && "opacity-50")}
            >
              {t.node}
            </div>
          );
        })}
      </div>

      <Dialog open={!!entryType} onOpenChange={(o) => !o && setEntryType(undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>New {entryType ? ENTRY_TYPES[entryType].label : ""} voucher</DialogTitle></DialogHeader>
          {entryType && <EntryForm key={entryType} defaultType={entryType} onSaved={() => setEntryType(undefined)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={newAcc} onOpenChange={setNewAcc}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
          {newAcc && <AccountForm onSaved={() => setNewAcc(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Head({ icon: Icon, label, light, tone }: { icon: typeof Wallet; label: string; light?: boolean; tone?: Tone }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className={cn("text-sm font-medium", light ? "opacity-85" : "text-muted-foreground")}>{label}</span>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", light ? "bg-hero-foreground/15" : tone && toneCls[tone])}><Icon className="h-[18px] w-[18px]" /></span>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-hero-foreground/10 p-3"><div className="text-xs opacity-75">{label}</div><div className="num mt-1 truncate font-semibold">{fmtPKR(value)}</div></div>;
}
const toneText: Record<Tone, string> = {
  received: "text-received", paid: "text-paid", sale: "text-sale", purchase: "text-purchase",
  account: "text-account", ledger: "text-ledger-card", report: "text-report-card",
  expense: "text-expense-card", entries: "text-entry-card", admin: "text-admin-card", hero: "text-hero",
};
const tileBase = "glass flex h-full w-full flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5";
function StatTile({ tone, icon, label, value, onClick, cta }: { tone: Tone; icon: typeof Wallet; label: string; value: number; onClick: () => void; cta: string }) {
  return (
    <button onClick={onClick} className={cn(tileBase, softCls[tone])}>
      <Head icon={icon} label={label} tone={tone} />
      <div><div className="num truncate text-xl font-semibold sm:text-2xl">{fmtPKR(value)}</div><div className={cn("mt-1 text-xs font-medium", toneText[tone])}>{cta} →</div></div>
    </button>
  );
}
function ActionTile({ tone, icon, label, detail, onClick }: { tone: Tone; icon: typeof Wallet; label: string; detail: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(tileBase, softCls[tone])}>
      <Head icon={icon} label="" tone={tone} />
      <div><div className="text-lg font-semibold">{label}</div><div className="num truncate text-xs text-muted-foreground">{detail}</div></div>
    </button>
  );
}
function LinkTile({ tone, icon, label, detail, to }: { tone: Tone; icon: typeof Wallet; label: string; detail: string; to: "/accounts" | "/reports" | "/admin" | "/entries" }) {
  return (
    <Link to={to} className={cn(tileBase, softCls[tone])}>
      <Head icon={icon} label="" tone={tone} />
      <div><div className="text-lg font-semibold">{label}</div><div className="text-xs text-muted-foreground">{detail}</div></div>
    </Link>
  );
}
function FilteredEntryTile({ tone, icon, label, detail, type }: { tone: Tone; icon: typeof Wallet; label: string; detail: string; type: "sale" | "purchase" }) {
  return (
    <Link to="/entries" search={{ type }} className={cn(tileBase, softCls[tone])}>
      <Head icon={icon} label="" tone={tone} />
      <div><div className="text-lg font-semibold">{label}</div><div className="num truncate text-xs text-muted-foreground">{detail}</div></div>
    </Link>
  );
}
function AccountCategoryTile({ tone, icon, label, detail, type }: { tone: Tone; icon: typeof Wallet; label: string; detail: string; type: "worker" }) {
  return (
    <Link to="/accounts" search={{ type }} className={cn(tileBase, softCls[tone])}>
      <Head icon={icon} label="" tone={tone} />
      <div><div className="text-lg font-semibold">{label}</div><div className="truncate text-xs text-muted-foreground">{detail}</div></div>
    </Link>
  );
}
