import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, TitleInput } from "./inputs";
import { addAccount, previewCode, searchAccounts, updateAccount, useData, ACCOUNT_TYPES, type Account, type AccountType } from "@/lib/db";

export function AccountForm({ initial, onSaved }: { initial?: Account; onSaved?: (a?: Account) => void }) {
  const d = useData();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "customer");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [opening, setOpening] = useState(initial ? String(initial.openingBalance || "") : "");
  const similar = !initial && name.trim().length >= 2 ? searchAccounts(d, name, 4) : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Account name is required"); return; }
    const payload = { name: name.trim(), type, phone: phone.trim(), address: address.trim(), openingBalance: Number(opening.replace(/,/g, "")) || 0 };
    if (initial) {
      updateAccount(initial.id, payload);
      toast.success("Account updated");
      onSaved?.();
    } else {
      const a = addAccount(payload);
      toast.success(`Account created · ${a.code}`);
      setName(""); setPhone(""); setAddress(""); setOpening("");
      onSaved?.(a);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Account Name *" className="sm:col-span-2">
          <TitleInput autoFocus value={name} onValueChange={setName} placeholder="e.g. Ali Traders" />
        </Field>
        <Field label="Short ID">
          <div className="num flex h-9 items-center rounded-md border border-dashed bg-surface px-3 text-sm font-semibold text-primary">
            {initial ? initial.code : name.trim() ? previewCode(name) : "—"}
          </div>
        </Field>
      </div>
      {similar.length > 0 && (
        <div className="rounded-md border border-warning bg-warning-soft px-3 py-2 text-xs">
          Similar accounts already exist: {similar.map((a) => `${a.name} (${a.code})`).join(", ")}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type">
          <NativeSelect value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {Object.entries(ACCOUNT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Phone (optional)">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Opening Balance (optional)">
          <Input className="num text-right" inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value.replace(/[^0-9.,-]/g, ""))} placeholder="0" />
        </Field>
      </div>
      <Field label="Address (optional)">
        <TitleInput value={address} onValueChange={setAddress} />
      </Field>
      <p className="text-xs text-muted-foreground">Opening balance: positive = receivable (they owe you), negative = payable (you owe them).</p>
      <div className="flex justify-end">
        <Button type="submit">{initial ? "Update Account" : "Create Account"}</Button>
      </div>
    </form>
  );
}
