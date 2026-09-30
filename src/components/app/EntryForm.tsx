import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountSearch, Field, NativeSelect, TitleInput } from "./inputs";
import {
  addEntry, addNamed, updateEntry, findDuplicate, getData, useData,
  ENTRY_TYPES, METHODS, type Entry, type EntryType, type PayMethod,
} from "@/lib/db";
import { todayISO, amountInWords } from "@/lib/format";
import { cn } from "@/lib/utils";

const DRAFT = "cashbook-entry-draft";
const TYPE_ORDER: EntryType[] = ["inward", "outward", "sale", "purchase", "salary", "advance", "expense"];

export function EntryForm({ initial, onSaved, defaultType = "inward" }: { initial?: Entry; onSaved?: (e?: Entry) => void; defaultType?: EntryType }) {
  const d = useData();
  const [type, setType] = useState<EntryType>(initial?.type ?? defaultType);
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [accountId, setAccountId] = useState(initial?.accountId);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [method, setMethod] = useState<PayMethod>(initial?.method ?? "cash");
  const [chequeNo, setChequeNo] = useState(initial?.chequeNo ?? "");
  const [bank, setBank] = useState(initial?.bank ?? "");
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [particulars, setParticulars] = useState(initial?.particulars ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [tagId, setTagId] = useState(initial?.tagId ?? "");
  const [formKey, setFormKey] = useState(0);

  const meta = ENTRY_TYPES[type];

  // Auto-draft: keeps unsaved typing safe across power cuts / accidental close.
  useEffect(() => {
    if (initial) return;
    try {
      const raw = localStorage.getItem(DRAFT);
      if (!raw) return;
      const dr = JSON.parse(raw);
      if (!dr.amount && !dr.particulars && !dr.accountId) return;
      toast("Unsaved draft recovered. Continue?", {
        duration: 15000,
        action: { label: "Restore", onClick: () => { setType(dr.type); setDate(dr.date); setAccountId(dr.accountId); setAmount(dr.amount); setParticulars(dr.particulars); setMethod(dr.method); setChequeNo(dr.chequeNo); setBank(dr.bank); setReference(dr.reference); setCategoryId(dr.categoryId); setTagId(dr.tagId); setFormKey((k) => k + 1); } },
        cancel: { label: "Discard", onClick: () => localStorage.removeItem(DRAFT) },
      });
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initial) return;
    const t = setTimeout(() => {
      if (amount || particulars || accountId) localStorage.setItem(DRAFT, JSON.stringify({ type, date, accountId, amount, particulars, method, chequeNo, bank, reference, categoryId, tagId }));
      else localStorage.removeItem(DRAFT);
    }, 1500);
    return () => clearTimeout(t);
  }, [initial, type, date, accountId, amount, particulars, method, chequeNo, bank, reference, categoryId, tagId]);

  useEffect(() => {
    if (initial) return;
    const h = (e: BeforeUnloadEvent) => { if (amount) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [initial, amount]);
  const amt = Number(amount.replace(/,/g, ""));

  const reset = () => {
    setAccountId(undefined); setAmount(""); setChequeNo(""); setBank(""); setReference(""); setParticulars("");
    setFormKey((k) => k + 1);
  };

  const submit = (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (meta.party && !accountId) { toast.error("Please select an account"); return; }
    if (!amt || amt <= 0) { toast.error("Please enter a valid amount"); return; }
    const payload = {
      type, date, amount: amt, particulars: particulars.trim() || (type === "expense" ? d.categories.find((c) => c.id === categoryId)?.name ?? "Expense" : ENTRY_TYPES[type].label),
      accountId: meta.party ? accountId : undefined,
      method: meta.cash ? method : undefined,
      chequeNo: meta.cash && method === "cheque" ? chequeNo : undefined,
      bank: meta.cash && method !== "cash" ? bank : undefined,
      reference: meta.cash && method === "online" ? reference : undefined,
      chequeStatus: meta.cash && method === "cheque" ? initial?.chequeStatus ?? "pending" : undefined,
      categoryId: type === "expense" ? categoryId : undefined,
      tagId: tagId || undefined,
    } as const;
    const dup = findDuplicate(getData(), payload, initial?.id);
    if (dup && !confirm(`A similar entry (V-${dup.voucherNo}) already exists for the same account, amount and date. Save anyway?`)) return;
    if (initial) {
      updateEntry(initial.id, payload);
      toast.success(`Voucher V-${initial.voucherNo} updated`);
      onSaved?.();
    } else {
      const e = addEntry(payload);
      toast.success(`Saved · Voucher V-${e.voucherNo}`);
      reset();
      localStorage.removeItem(DRAFT);
      onSaved?.(e);
    }
  };

  const addCat = (kind: "categories" | "tags") => {
    const name = prompt(kind === "categories" ? "New category name (e.g. Bijli Bill)" : "New tag / location (e.g. Factory)");
    if (!name?.trim()) return;
    const item = addNamed(kind, name.trim().replace(/(^|\s)(\p{L})/gu, (_m, a, b) => a + b.toUpperCase()));
    if (kind === "categories") setCategoryId(item.id); else setTagId(item.id);
  };

  return (
    <form onSubmit={submit} data-entry-form className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {TYPE_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              type === t
                ? ENTRY_TYPES[t].flow === "in"
                  ? "border-success bg-success text-success-foreground"
                  : ENTRY_TYPES[t].flow === "out"
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {ENTRY_TYPES[t].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {meta.party ? (
          <Field label={type === "salary" || type === "advance" ? "Worker" : "Account"} className="lg:col-span-2">
            <AccountSearch key={formKey} id="entry-account" value={accountId} onSelect={(a) => setAccountId(a.id)} />
          </Field>
        ) : (
          <Field label="Category" className="lg:col-span-2">
            <div className="flex gap-2">
              <NativeSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select category (optional)…</option>
                {d.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => addCat("categories")}>+ New</Button>
            </div>
          </Field>
        )}
        <Field label="Amount (Rs)">
          <Input id="entry-amount" inputMode="decimal" className="num text-right" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="0" />
        </Field>
      </div>

      {amt > 0 && <p className="-mt-2 text-right text-xs text-muted-foreground">{amountInWords(amt)}</p>}

      {meta.cash && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Payment Method">
            <NativeSelect value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
              {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </NativeSelect>
          </Field>
          {method === "cheque" && (
            <Field label="Cheque No.">
              <Input value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} className="num" />
            </Field>
          )}
          {method !== "cash" && (
            <Field label="Bank">
              <TitleInput value={bank} onValueChange={setBank} placeholder="e.g. Meezan Bank" />
            </Field>
          )}
          {method === "online" && (
            <Field label="Transaction Ref.">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Particulars" className="lg:col-span-3">
          <TitleInput value={particulars} onValueChange={setParticulars} placeholder={type === "sale" || type === "purchase" ? "e.g. Iron Billet 25 Ton" : "Details / remarks"} />
        </Field>
        <Field label="Tag / Location">
          <div className="flex gap-2">
            <NativeSelect value={tagId} onChange={(e) => setTagId(e.target.value)}>
              <option value="">None</option>
              {d.tags.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => addCat("tags")}>+</Button>
          </div>
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <span className="mr-auto text-xs text-muted-foreground">Press <kbd className="rounded border bg-secondary px-1">Ctrl</kbd>+<kbd className="rounded border bg-secondary px-1">S</kbd> to save</span>
        {!initial && <Button type="button" variant="ghost" onClick={reset}>Clear</Button>}
        <Button type="submit" variant={meta.flow === "in" ? "success" : meta.flow === "out" ? "destructive" : "default"}>
          {initial ? "Update Entry" : `Save ${meta.label}`}
        </Button>
      </div>
    </form>
  );
}
