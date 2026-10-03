import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AccountForm } from "@/components/app/AccountForm";
import { NativeSelect, PageHeader } from "@/components/app/inputs";
import { accountBalance, accountTypeLabel, liveAccounts, useData, ACCOUNT_TYPES } from "@/lib/db";
import { fmtPKR, norm } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Mussa Enterprises Cash Book" },
      { name: "description", content: "Customers, suppliers and workers with auto short IDs and live balances." },
      { property: "og:title", content: "Accounts — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "Customers, suppliers and workers with auto short IDs and live balances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  const d = useData();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const list = useMemo(() => {
    const n = norm(q);
    return liveAccounts(d)
      .filter((a) => (!type || a.type === type) && (!n || norm(a.name + a.code + a.phone + a.address).includes(n)))
      .map((a) => ({ a, b: accountBalance(d, a.id) }))
      .sort((x, y) => x.a.name.localeCompare(y.a.name));
  }, [d, q, type]);

  return (
    <div>
      <PageHeader title="Accounts" subtitle={`${list.length} accounts`} actions={<Button onClick={() => setOpen(true)}><Plus /> New Account</Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-sm" placeholder="Filter by name, ID, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect className="w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(ACCOUNT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          {d.accountTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </NativeSelect>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Short ID</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Phone</th>
              <th className="px-4 py-2.5 text-right">Balance (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No accounts yet — click “New Account”.</td></tr>}
            {list.map(({ a, b }) => (
              <tr key={a.id} className="border-t hover:bg-surface">
                <td className="num px-4 py-2.5 font-semibold text-primary">{a.code}</td>
                <td className="px-4 py-2.5"><Link to="/ledger/$id" params={{ id: a.id }} className="font-medium hover:text-primary hover:underline">{a.name}</Link></td>
                <td className="px-4 py-2.5 text-muted-foreground">{accountTypeLabel(d, a.type)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.phone || "—"}</td>
                <td className={cn("num px-4 py-2.5 text-right font-medium", b > 0 && "text-success", b < 0 && "text-destructive")}>
                  {fmtPKR(Math.abs(b), false)} {b > 0 ? "Dr" : b < 0 ? "Cr" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Dr = receivable (they owe you) · Cr = payable (you owe them)</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
          <AccountForm onSaved={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
