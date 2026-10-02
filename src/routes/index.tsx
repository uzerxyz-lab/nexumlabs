import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownLeft, ArrowUpRight, BarChart3, BookOpen, ChevronLeft, ChevronRight, GripVertical, Receipt,
  RotateCcw, ShieldCheck, ShoppingCart, UserPlus, Wallet, Scale, ListOrdered,
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
const DEFAULT_ORDER = ["summary", "inflow", "outflow", "sale", "purchase", "account", "ledgers", "reports", "expense", "entries", "admin"];
type Tone = "inflow" | "outflow" | "ledger" | "report" | "hero";
const toneCls: Record<Tone, string> = {
  inflow: "bg-inflow text-hero-foreground",
  outflow: "bg-outflow text-hero-foreground",
  ledger: "bg-ledger text-hero-foreground",
  report: "bg-report text-hero-foreground",
  hero: "bg-hero text-hero-foreground",
};
const softCls: Record<Tone, string> = {
  inflow: "border-inflow/40 bg-inflow/20",
  outflow: "border-outflow/40 bg-outflow/20",
  ledger: "border-ledger/40 bg-ledger/20",
  report: "border-report/40 bg-report/20",
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
  const move = (k: string, dir: -1 | 1) => {
    const i = order.indexOf(k); const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const o = [...order]; [o[i], o[j]] = [o[j]!, o[i]!]; save(o);
  };
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
    inflow: { span: "", node: <StatTile tone="inflow" icon={ArrowDownLeft} label="Received today" value={cashIn} onClick={() => setEntryType("inward")} cta="New receipt" /> },
    outflow: { span: "", node: <StatTile tone="outflow" icon={ArrowUpRight} label="Paid today" value={cashOut} onClick={() => setEntryType("outward")} cta="New payment" /> },
    sale: { span: "", node: <ActionTile tone="inflow" icon={BarChart3} label="Sale" detail={`This month ${fmtPKR(mt("sale"))}`} onClick={() => setEntryType("sale")} /> },
    purchase: { span: "", node: <ActionTile tone="outflow" icon={ShoppingCart} label="Purchase" detail={`This month ${fmtPKR(mt("purchase"))}`} onClick={() => setEntryType("purchase")} /> },
    account: { span: "", node: <ActionTile tone="ledger" icon={UserPlus} label="New Account" detail={`${liveAccounts(d).length} accounts`} onClick={() => setNewAcc(true)} /> },
    ledgers: { span: "col-span-2", node: <LinkTile tone="ledger" icon={BookOpen} label="Ledgers & Accounts" detail="Party balances, statements and history" to="/accounts" /> },
    reports: { span: "col-span-2", node: <LinkTile tone="report" icon={Scale} label="Reports" detail="Cash book, sales, purchases, salaries and expenses" to="/reports" /> },
    expense: { span: "", node: <ActionTile tone="outflow" icon={Receipt} label="Expense" detail={`This month ${fmtPKR(mt("expense"))}`} onClick={() => setEntryType("expense")} /> },
    entries: { span: "", node: <LinkTile tone="hero" icon={ListOrdered} label="All Entries" detail={`${entries.length} vouchers`} to="/entries" /> },
    admin: { span: "col-span-2", node: <LinkTile tone="hero" icon={ShieldCheck} label="Admin Panel" detail="Delete, edit and restore from the Recycle Bin" to="/admin" /> },
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{d.company.name || "Mussa Enterprises"}</p>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/reports" className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-surface"><Scale className="h-4 w-4 text-report" /> Reports</Link>
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-hero px-4 py-2 text-sm font-medium text-hero-foreground hover:opacity-90"><ShieldCheck className="h-4 w-4" /> Admin Panel</Link>
          <button onClick={() => save(DEFAULT_ORDER)} title="Reset tile order" className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-surface"><RotateCcw className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Drag tiles (or use the arrows) to rearrange your dashboard.</p>
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
              className={cn("group relative min-w-0", t.span, drag === k && "opacity-50")}
            >
              {t.node}
              <div className="absolute right-2 bottom-2 flex gap-0.5 rounded-full bg-background/80 p-0.5 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button aria-label="Move left" onClick={() => move(k, -1)} className="rounded-full p-1 text-muted-foreground hover:text-foreground"><ChevronLeft className="h-3.5 w-3.5" /></button>
                <span className="cursor-grab p-1 text-muted-foreground"><GripVertical className="h-3.5 w-3.5" /></span>
                <button aria-label="Move right" onClick={() => move(k, 1)} className="rounded-full p-1 text-muted-foreground hover:text-foreground"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
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
const toneText: Record<Tone, string> = { inflow: "text-inflow", outflow: "text-outflow", ledger: "text-ledger", report: "text-report", hero: "text-hero" };
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
