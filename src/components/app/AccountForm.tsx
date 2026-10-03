import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, TitleInput } from "./inputs";
import { addAccount, addAccountType, accountTypeLabel, previewCode, searchAccounts, updateAccount, useData, ACCOUNT_TYPES, type Account, type AccountType } from "@/lib/db";

export function AccountForm({ initial, onSaved }: { initial?: Account; onSaved?: (a?: Account) => void }) {
  const d = useData();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "buyer");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [wages, setWages] = useState(initial?.fixedWages ? String(initial.fixedWages) : "");
  const [idCard, setIdCard] = useState(initial?.idCard ?? "");
  const [balanceSide, setBalanceSide] = useState<"receivable" | "payable">((initial?.openingBalance ?? 0) < 0 ? "payable" : "receivable");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [opening, setOpening] = useState(initial ? String(initial.openingBalance || "") : "");
  const similar = !initial && name.trim().length >= 2 ? searchAccounts(d, name, 4, type) : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Account name is required"); return; }
    const openingAmount = Math.abs(Number(opening.replace(/,/g, "")) || 0);
    const payload = { name: name.trim(), type, title: title.trim(), fixedWages: Number(wages.replace(/,/g, "")) || undefined, idCard: idCard.trim(), phone: phone.trim(), address: address.trim(), openingBalance: balanceSide === "payable" ? -openingAmount : openingAmount };
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
        <Field label="Account Type *">
          <NativeSelect value={type} onChange={(e) => {
            if (e.target.value === "__new") {
              const value = prompt("New account type name");
              if (value?.trim()) setType(addAccountType(value.trim()).id);
            } else setType(e.target.value);
          }}>
            {Object.entries(ACCOUNT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            {d.accountTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            <option value="__new">+ New Account Type</option>
          </NativeSelect>
        </Field>
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
        {type !== "worker" && <Field label="Title (optional)"><TitleInput value={title} onValueChange={setTitle} placeholder="e.g. Proprietor" /></Field>}
        {type === "worker" && <Field label="Fixed Wages (optional)"><Input inputMode="decimal" value={wages} onChange={(e) => setWages(e.target.value.replace(/[^0-9.,]/g, ""))} /></Field>}
        <Field label="Phone (optional)">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        {type === "worker" && <Field label="ID Card No. (optional)"><Input value={idCard} onChange={(e) => setIdCard(e.target.value)} /></Field>}
        {type !== "worker" && <Field label="Opening Balance (optional)">
          <Input className="num text-right" inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value.replace(/[^0-9.,-]/g, ""))} placeholder="0" />
        </Field>}
      </div>
      {type !== "worker" && <Field label="Balance Type"><NativeSelect value={balanceSide} onChange={(e) => setBalanceSide(e.target.value as "receivable" | "payable")}><option value="receivable">Receivable — They Owe Us</option><option value="payable">Payable — We Owe Them</option></NativeSelect></Field>}
      <Field label="Address (optional)">
        <TitleInput value={address} onValueChange={setAddress} />
      </Field>
      <p className="text-xs text-muted-foreground">Creating {accountTypeLabel(d, type)} account. Only the name is required.</p>
      <div className="flex justify-end">
        <Button type="submit">{initial ? "Update Account" : "Create Account"}</Button>
      </div>
    </form>
  );
}
