import { useSyncExternalStore } from "react";
import { norm } from "./format";

export type AccountType = "customer" | "supplier" | "worker" | "other";
export type EntryType = "inward" | "outward" | "sale" | "purchase" | "salary" | "advance" | "expense";
export type PayMethod = "cash" | "cheque" | "online";
export type ChequeStatus = "pending" | "cleared" | "bounced";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  phone: string;
  address: string;
  openingBalance: number;
  createdAt: string;
  deletedAt?: string | undefined;
}

export interface Entry {
  id: string;
  voucherNo: number;
  type: EntryType;
  date: string;
  accountId?: string | undefined;
  amount: number;
  method?: PayMethod | undefined;
  chequeNo?: string | undefined;
  bank?: string | undefined;
  reference?: string | undefined;
  chequeStatus?: ChequeStatus | undefined;
  particulars: string;
  categoryId?: string | undefined;
  tagId?: string | undefined;
  createdAt: string;
  updatedAt?: string | undefined;
  deletedAt?: string | undefined;
}

export interface Named {
  id: string;
  name: string;
}

export interface LogItem {
  id: string;
  action: "delete" | "edit";
  kind: "account" | "entry";
  refId: string;
  label: string;
  at: string;
  before?: Account | Entry | undefined;
  childIds?: string[] | undefined;
  restoredAt?: string | undefined;
}

export interface Data {
  accounts: Account[];
  entries: Entry[];
  categories: Named[];
  tags: Named[];
  log: LogItem[];
  seq: number;
  voucherSeq: number;
  company: { name: string; address: string; phone: string };
  auth?: { username: string | undefined; hash: string };
}

export const ENTRY_TYPES: Record<EntryType, { label: string; cash: boolean; party: boolean; flow: "in" | "out" | "none" }> = {
  inward: { label: "Cash Inward", cash: true, party: true, flow: "in" },
  outward: { label: "Cash Outward", cash: true, party: true, flow: "out" },
  sale: { label: "Sale", cash: false, party: true, flow: "none" },
  purchase: { label: "Purchase", cash: false, party: true, flow: "none" },
  salary: { label: "Salary", cash: true, party: true, flow: "out" },
  advance: { label: "Advance", cash: true, party: true, flow: "out" },
  expense: { label: "Expense", cash: true, party: false, flow: "out" },
};

export const METHODS: Record<PayMethod, string> = { cash: "Cash", cheque: "Cheque", online: "Online Transfer" };
export const ACCOUNT_TYPES: Record<AccountType, string> = {
  customer: "Customer",
  supplier: "Supplier",
  worker: "Worker",
  other: "Other",
};

const KEY = "cashbook-data-v1";
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now());

function empty(): Data {
  const n = (name: string): Named => ({ id: uid(), name });
  return {
    accounts: [],
    entries: [],
    categories: ["Bijli Bill", "Gas Bill", "Pani Bill", "Transport", "Rent", "Chai Pani", "Maintenance", "Stationery"].map(n),
    tags: ["Factory", "Ghar", "Office"].map(n),
    log: [],
    seq: 1,
    voucherSeq: 1,
    company: { name: "", address: "", phone: "" },
  };
}

let data: Data = empty();
let loaded = false;
let past: Data[] = [];
let future: Data[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function persist() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function loadData() {
  if (loaded) return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = { ...empty(), ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt data */
  }
  loaded = true;
  emit();
}

function commit(mut: (d: Data) => void, undoable = true) {
  if (undoable) {
    past.push(data);
    if (past.length > 60) past.shift();
    future = [];
  }
  const next = structuredClone(data);
  mut(next);
  data = next;
  persist();
  emit();
}

export function undo() {
  const p = past.pop();
  if (!p) return false;
  future.push(data);
  data = p;
  persist();
  emit();
  return true;
}
export function redo() {
  const f = future.pop();
  if (!f) return false;
  past.push(data);
  data = f;
  persist();
  emit();
  return true;
}

export function useData() {
  return useSyncExternalStore(subscribe, () => data, () => data);
}
export function useLoaded() {
  return useSyncExternalStore(subscribe, () => loaded, () => false);
}
export const getData = () => data;

/* ---------- auth ---------- */
export async function hashPw(pw: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cb::" + pw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function setupAuth(username: string, pw: string, companyName: string) {
  const hash = await hashPw(pw);
  commit((d) => {
    d.auth = { username, hash };
    if (companyName) d.company.name = companyName;
  }, false);
}
export async function checkPw(pw: string, username?: string) {
  if (!data.auth) return false;
  if (username !== undefined && norm(username) !== norm(data.auth.username)) return false;
  return (await hashPw(pw)) === data.auth.hash;
}
export function updateCompany(c: Data["company"]) {
  commit((d) => {
    d.company = c;
  }, false);
}

/* ---------- accounts ---------- */
export function initials(name: string) {
  const i = name
    .split(/[\s\-_.]+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, "")[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 5);
  return i || "AC";
}
export function previewCode(name: string) {
  return `${initials(name)}01${data.seq}`;
}

export function addAccount(a: Omit<Account, "id" | "code" | "createdAt">) {
  const acc: Account = { ...a, id: uid(), code: previewCode(a.name), createdAt: new Date().toISOString() };
  commit((d) => {
    d.accounts.push(acc);
    d.seq += 1;
  });
  return acc;
}

export function updateAccount(id: string, patch: Partial<Account>) {
  commit((d) => {
    const a = d.accounts.find((x) => x.id === id);
    if (!a) return;
    d.log.unshift({ id: uid(), action: "edit", kind: "account", refId: id, label: `${a.code} · ${a.name}`, at: new Date().toISOString(), before: { ...a } });
    Object.assign(a, patch);
  });
}

/* ---------- entries ---------- */
export function addEntry(e: Omit<Entry, "id" | "voucherNo" | "createdAt">) {
  const entry: Entry = { ...e, id: uid(), voucherNo: data.voucherSeq, createdAt: new Date().toISOString() };
  commit((d) => {
    d.entries.push(entry);
    d.voucherSeq += 1;
  });
  return entry;
}
export function updateEntry(id: string, patch: Partial<Entry>) {
  commit((d) => {
    const e = d.entries.find((x) => x.id === id);
    if (!e) return;
    d.log.unshift({ id: uid(), action: "edit", kind: "entry", refId: id, label: entryLabel(d, e), at: new Date().toISOString(), before: { ...e } });
    Object.assign(e, patch, { updatedAt: new Date().toISOString() });
  });
}

function entryLabel(d: Data, e: Entry) {
  const acc = d.accounts.find((a) => a.id === e.accountId);
  return `V-${e.voucherNo} · ${ENTRY_TYPES[e.type].label} · ${acc?.name ?? e.particulars} · Rs ${e.amount.toLocaleString("en-IN")}`;
}

/* ---------- delete / restore ---------- */
export function deleteItems(kind: "account" | "entry", ids: string[]) {
  const now = new Date().toISOString();
  commit((d) => {
    for (const id of ids) {
      if (kind === "entry") {
        const e = d.entries.find((x) => x.id === id && !x.deletedAt);
        if (!e) continue;
        e.deletedAt = now;
        d.log.unshift({ id: uid(), action: "delete", kind, refId: id, label: entryLabel(d, e), at: now, before: { ...e } });
      } else {
        const a = d.accounts.find((x) => x.id === id && !x.deletedAt);
        if (!a) continue;
        a.deletedAt = now;
        const childIds: string[] = [];
        d.entries.forEach((e) => {
          if (e.accountId === id && !e.deletedAt) {
            e.deletedAt = now;
            childIds.push(e.id);
          }
        });
        d.log.unshift({ id: uid(), action: "delete", kind, refId: id, label: `${a.code} · ${a.name}${childIds.length ? ` (+${childIds.length} entries)` : ""}`, at: now, before: { ...a }, childIds });
      }
    }
  });
}

export function restoreLog(logIds: string[]) {
  const now = new Date().toISOString();
  commit((d) => {
    for (const lid of logIds) {
      const l = d.log.find((x) => x.id === lid);
      if (!l || l.restoredAt) continue;
      if (l.action === "delete") {
        const list = l.kind === "account" ? d.accounts : d.entries;
        const item = (list as { id: string; deletedAt?: string }[]).find((x) => x.id === l.refId);
        if (item) delete item.deletedAt;
        l.childIds?.forEach((cid) => {
          const e = d.entries.find((x) => x.id === cid);
          if (e) delete e.deletedAt;
        });
      } else if (l.before) {
        if (l.kind === "account") {
          const i = d.accounts.findIndex((x) => x.id === l.refId);
          if (i >= 0) d.accounts[i] = { ...(l.before as Account), deletedAt: d.accounts[i].deletedAt };
        } else {
          const i = d.entries.findIndex((x) => x.id === l.refId);
          if (i >= 0) d.entries[i] = { ...(l.before as Entry), deletedAt: d.entries[i].deletedAt };
        }
      }
      l.restoredAt = now;
    }
  });
}

export function purgeLog(logIds: string[]) {
  commit((d) => {
    for (const lid of logIds) {
      const l = d.log.find((x) => x.id === lid);
      if (!l) continue;
      if (l.action === "delete" && !l.restoredAt) {
        if (l.kind === "account") d.accounts = d.accounts.filter((a) => a.id !== l.refId);
        else d.entries = d.entries.filter((e) => e.id !== l.refId);
        if (l.childIds) d.entries = d.entries.filter((e) => !l.childIds!.includes(e.id));
      }
      d.log = d.log.filter((x) => x.id !== lid);
    }
  });
}

/* ---------- categories / tags ---------- */
export function addNamed(kind: "categories" | "tags", name: string) {
  const item = { id: uid(), name };
  commit((d) => {
    d[kind].push(item);
  });
  return item;
}
export function renameNamed(kind: "categories" | "tags", id: string, name: string) {
  commit((d) => {
    const x = d[kind].find((i) => i.id === id);
    if (x) x.name = name;
  });
}
export function removeNamed(kind: "categories" | "tags", id: string) {
  commit((d) => {
    d[kind] = d[kind].filter((i) => i.id !== id);
  });
}

/* ---------- queries ---------- */
export const liveAccounts = (d: Data) => d.accounts.filter((a) => !a.deletedAt);
export const liveEntries = (d: Data) => d.entries.filter((e) => !e.deletedAt);

/** Debit (+) increases what party owes us; credit (-) decreases. */
export function signedForAccount(e: Entry) {
  switch (e.type) {
    case "sale":
    case "outward":
    case "salary":
    case "advance":
      return e.amount;
    case "inward":
    case "purchase":
      return -e.amount;
    default:
      return 0;
  }
}

export function accountBalance(d: Data, id: string) {
  const a = d.accounts.find((x) => x.id === id);
  let b = a?.openingBalance ?? 0;
  for (const e of d.entries) if (!e.deletedAt && e.accountId === id) b += signedForAccount(e);
  return b;
}

export function cashFlow(e: Entry) {
  const f = ENTRY_TYPES[e.type].flow;
  if (e.chequeStatus === "bounced") return 0;
  return f === "in" ? e.amount : f === "out" ? -e.amount : 0;
}

export function searchAccounts(d: Data, q: string, limit = 8) {
  const n = norm(q);
  if (!n) return [];
  const list = liveAccounts(d);
  const starts = list.filter((a) => norm(a.name).startsWith(n) || norm(a.code).startsWith(n));
  const contains = list.filter((a) => !starts.includes(a) && (norm(a.name).includes(n) || norm(a.code).includes(n) || norm(a.phone).includes(n) || norm(a.address).includes(n)));
  return [...starts, ...contains].slice(0, limit);
}

export function findDuplicate(d: Data, e: { accountId?: string | undefined; amount: number; date: string; type: EntryType }, ignoreId?: string) {
  return liveEntries(d).find((x) => x.id !== ignoreId && x.type === e.type && x.accountId === e.accountId && x.amount === e.amount && x.date === e.date);
}

/* ---------- backup ---------- */
export function exportJSON() {
  return JSON.stringify({ app: "cashbook", version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}
export function importJSON(text: string) {
  const parsed = JSON.parse(text);
  const incoming: Data = parsed.data ?? parsed;
  if (!Array.isArray(incoming.accounts) || !Array.isArray(incoming.entries)) throw new Error("Invalid backup file");
  commit((d) => {
    Object.assign(d, { ...empty(), ...incoming, auth: d.auth ?? incoming.auth });
  });
}

/* ---------- rolling snapshots (auto-backup) ---------- */
const SNAP = "cashbook-snapshots";
export interface Snapshot { at: string; data: string }
export function getSnapshots(): Snapshot[] {
  try { return JSON.parse(localStorage.getItem(SNAP) || "[]"); } catch { return []; }
}
export function takeSnapshot() {
  if (!loaded) return;
  const list = getSnapshots();
  const json = JSON.stringify(data);
  if (list[0]?.data === json) return;
  list.unshift({ at: new Date().toISOString(), data: json });
  try { localStorage.setItem(SNAP, JSON.stringify(list.slice(0, 10))); } catch { localStorage.setItem(SNAP, JSON.stringify(list.slice(0, 3))); }
}
export function restoreSnapshot(at: string) {
  const s = getSnapshots().find((x) => x.at === at);
  if (!s) return;
  const parsed = JSON.parse(s.data);
  commit((d) => { Object.assign(d, { ...empty(), ...parsed, auth: d.auth }); });
}
export async function changePassword(pw: string) {
  const hash = await hashPw(pw);
  commit((d) => { if (d.auth) d.auth.hash = hash; }, false);
}
