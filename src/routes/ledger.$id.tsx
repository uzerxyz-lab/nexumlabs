import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PageHeader, PrintHeader } from "@/components/app/inputs";
import { TypeBadge } from "@/components/app/EntriesTable";
import { liveEntries, signedForAccount, useData, ACCOUNT_TYPES, METHODS } from "@/lib/db";
import { downloadFile, fmtDate, fmtPKR, toCSV, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ledger/$id")({
  head: () => ({
    meta: [
      { title: "Party Ledger — Mussa Enterprises Cash Book" },
      { name: "description", content: "Date-wise party statement with debit, credit and running balance." },
      { property: "og:title", content: "Party Ledger — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "Date-wise party statement with debit, credit and running balance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LedgerPage,
});

function LedgerPage() {
  const { id } = Route.useParams();
  const d = useData();
  const a = d.accounts.find((x) => x.id === id);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { opening, rows, closing, dr, cr } = useMemo(() => {
    const all = liveEntries(d).filter((e) => e.accountId === id).sort((x, y) => x.date.localeCompare(y.date) || x.voucherNo - y.voucherNo);
    let bal = a?.openingBalance ?? 0;
    for (const e of all) if (from && e.date < from) bal += signedForAccount(e);
    const opening = bal;
    let dr = 0, cr = 0;
    const rows = all.filter((e) => (!from || e.date >= from) && (!to || e.date <= to)).map((e) => {
      const s = signedForAccount(e);
      bal += s;
      if (s > 0) dr += s; else cr -= s;
      return { e, debit: s > 0 ? s : 0, credit: s < 0 ? -s : 0, bal };
    });
    return { opening, rows, closing: bal, dr, cr };
  }, [d, id, a, from, to]);

  if (!a) return <div className="py-20 text-center text-muted-foreground">Account not found. <Link to="/accounts" className="text-primary hover:underline">Back to accounts</Link></div>;

  const balText = (b: number) => `${fmtPKR(Math.abs(b), false)} ${b > 0 ? "Dr" : b < 0 ? "Cr" : ""}`;
  const period = from || to ? `${fmtDate(from) || "Start"} to ${fmtDate(to) || fmtDate(todayISO())}` : "All dates";

  const exportCSV = () => {
    const out: (string | number)[][] = [[`${a.name} (${a.code})`], ["Period", period], [], ["Date", "Voucher", "Type", "Particulars", "Method", "Debit", "Credit", "Balance"], ["", "", "", "Opening Balance", "", "", "", balText(opening)]];
    rows.forEach(({ e, debit, credit, bal }) => out.push([fmtDate(e.date), `V-${e.voucherNo}`, e.type, e.particulars, e.method ? METHODS[e.method] : "", debit || "", credit || "", balText(bal)]));
    out.push(["", "", "", "Closing Balance", "", dr, cr, balText(closing)]);
    downloadFile(`ledger-${a.code}.csv`, toCSV(out));
  };

  return (
    <div>
      <PageHeader
        title={a.name}
        subtitle={`${a.code} · ${ACCOUNT_TYPES[a.type]}${a.phone ? " · " + a.phone : ""}`}
        actions={<>
          <Button variant="outline" onClick={exportCSV}><Download /> Excel</Button>
          <Button onClick={() => window.print()}><Printer /> Print / PDF</Button>
        </>}
      />
      <PrintHeader title="Account Statement" sub={period} />
      <div className="print-only mb-3 text-sm">
        <div className="font-semibold">{a.name} <span className="num">({a.code})</span></div>
        {a.phone && <div>{a.phone}</div>}
        {a.address && <div>{a.address}</div>}
      </div>

      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        {(from || to) && <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Clear</Button>}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[["Opening", opening], ["Total Debit", dr], ["Total Credit", -cr], ["Closing", closing]].map(([l, v]) => (
          <div key={l as string} className="rounded-lg border bg-card p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{l}</div>
            <div className={cn("num mt-1 text-lg font-semibold", (l === "Opening" || l === "Closing") && ((v as number) > 0 ? "text-success" : (v as number) < 0 ? "text-destructive" : ""))}>
              {l === "Opening" || l === "Closing" ? balText(v as number) : fmtPKR(Math.abs(v as number), false)}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card print-area">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Voucher</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Particulars</th>
              <th className="px-3 py-2.5">Method</th>
              <th className="px-3 py-2.5 text-right">Debit</th>
              <th className="px-3 py-2.5 text-right">Credit</th>
              <th className="px-3 py-2.5 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t bg-surface/50 font-medium">
              <td colSpan={7} className="px-3 py-2">Opening Balance</td>
              <td className="num px-3 py-2 text-right">{balText(opening)}</td>
            </tr>
            {rows.map(({ e, debit, credit, bal }) => (
              <tr key={e.id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">{fmtDate(e.date)}</td>
                <td className="num px-3 py-2"><Link to="/voucher/$id" params={{ id: e.id }} className="hover:text-primary">V-{e.voucherNo}</Link></td>
                <td className="px-3 py-2"><TypeBadge type={e.type} /></td>
                <td className="px-3 py-2">{e.particulars}{e.chequeNo && <span className="text-xs text-muted-foreground"> · Chq #{e.chequeNo}</span>}</td>
                <td className="px-3 py-2 text-xs">{e.method ? METHODS[e.method] : "—"}</td>
                <td className="num px-3 py-2 text-right">{debit ? debit.toLocaleString("en-IN") : ""}</td>
                <td className="num px-3 py-2 text-right">{credit ? credit.toLocaleString("en-IN") : ""}</td>
                <td className="num px-3 py-2 text-right font-medium">{balText(bal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-surface font-semibold">
              <td colSpan={5} className="px-3 py-2">Closing Balance</td>
              <td className="num px-3 py-2 text-right">{dr.toLocaleString("en-IN")}</td>
              <td className="num px-3 py-2 text-right">{cr.toLocaleString("en-IN")}</td>
              <td className="num px-3 py-2 text-right">{balText(closing)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="print-only mt-16 flex justify-between text-xs">
        <span className="border-t px-8 pt-1">Prepared By</span>
        <span className="border-t px-8 pt-1">Authorized Signature</span>
      </div>
    </div>
  );
}
