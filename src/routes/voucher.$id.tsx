import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintHeader } from "@/components/app/inputs";
import { useData, ENTRY_TYPES, METHODS } from "@/lib/db";
import { amountInWords, fmtDate, fmtPKR, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/voucher/$id")({
  head: () => ({
    meta: [
      { title: "Voucher — Mussa Enterprises Cash Book" },
      { name: "description", content: "Printable payment / receipt voucher." },
      { property: "og:title", content: "Voucher — Mussa Enterprises Cash Book" },
      { property: "og:description", content: "Printable payment / receipt voucher." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VoucherPage,
});

function Row({ label, value }: { label: string; value?: string | undefined }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 border-b py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

function VoucherPage() {
  const { id } = Route.useParams();
  const d = useData();
  const e = d.entries.find((x) => x.id === id);
  if (!e) return <div className="py-20 text-center text-muted-foreground">Voucher not found. <Link to="/entries" search={{}} className="text-primary hover:underline">Back</Link></div>;
  const a = d.accounts.find((x) => x.id === e.accountId);
  const meta = ENTRY_TYPES[e.type];
  const title = meta.flow === "in" ? "Receipt Voucher" : meta.flow === "out" ? "Payment Voucher" : `${meta.label} Voucher`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex justify-between">
        <Button variant="ghost" onClick={() => history.back()}>← Back</Button>
        <Button onClick={() => window.print()}><Printer /> Print Voucher</Button>
      </div>
      <div className="print-area rounded-lg border bg-card p-8">
        <PrintHeader always title={title} sub={`V-${e.voucherNo}`} />
        {e.deletedAt && <div className="mb-3 rounded bg-danger-soft px-3 py-1.5 text-sm text-destructive">This voucher has been deleted.</div>}
        <Row label="Date / Time" value={`${fmtDate(e.date)} · ${fmtTime(e.createdAt)}`} />
        <Row label={meta.flow === "in" ? "Received From" : meta.flow === "out" ? "Paid To" : "Account"} value={a ? `${a.name} (${a.code})` : undefined} />
        <Row label="Category" value={d.categories.find((c) => c.id === e.categoryId)?.name} />
        <Row label="Tag / Location" value={d.tags.find((c) => c.id === e.tagId)?.name} />
        <Row label="Particulars" value={e.particulars} />
        <Row label="Payment Method" value={e.method ? METHODS[e.method] : undefined} />
        <Row label="Cheque No." value={e.chequeNo} />
        <Row label="Bank" value={e.bank} />
        <Row label="Reference" value={e.reference} />
        <div className="mt-6 rounded-md bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm uppercase tracking-wide text-muted-foreground">Amount</span>
            <span className="num text-2xl font-bold">{fmtPKR(e.amount)}</span>
          </div>
          <div className="mt-1 text-right text-sm italic">{amountInWords(e.amount)}</div>
        </div>
        <div className="mt-20 grid grid-cols-3 gap-6 text-center text-xs">
          <span className="border-t pt-1">Prepared By</span>
          <span className="border-t pt-1">Received By</span>
          <span className="border-t pt-1">Authorized Signature</span>
        </div>
      </div>
    </div>
  );
}
